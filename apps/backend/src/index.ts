import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '@helix/database/client';
import { intents, agents, auditLogs } from '@helix/database/schema';
import { eq, desc, and, lte, or, isNull } from 'drizzle-orm';
import { processUserIntent, executeIntent } from './orchestrator/core';
import { authMiddleware } from './middleware/auth';
import { redis } from './lib/redis';
import { oracleService } from './lib/oracleService';
import { mcpRouter } from './mcp/mcpServer';
import { registerOnChainAgent, recordOnChainIntent } from './blockchain/blockchainService';
import { supabaseAdmin } from './lib/supabase';
import { keccak256, toBytes } from 'viem';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-402-payment-tx'],
}));

// Route MCP Tools Gated endpoints
app.route('/api/mcp', mcpRouter);

// Protect intents routes
app.use('/api/intents*', authMiddleware);

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'Helix Core Backend API', timestamp: new Date() });
});

// Telemetry endpoints
app.get('/api/telemetry', (c) => {
  return c.json(oracleService.getTelemetry());
});

app.post('/api/telemetry', async (c) => {
  try {
    const body = await c.req.json();
    const { action, target, value } = body;

    if (action === 'tvl') {
      oracleService.updateProtocolTvl(target, Number(value));
    } else if (action === 'depth') {
      oracleService.updateProtocolExitDepth(target, Number(value));
    } else if (action === 'peg') {
      oracleService.updateTokenPeg(target, Number(value));
    } else if (action === 'gas') {
      oracleService.updateGasPrice(target, Number(value));
    } else if (action === 'reset') {
      oracleService.reset();
    } else {
      return c.json({ error: 'Invalid telemetry action' }, 400);
    }

    return c.json({ success: true, telemetry: oracleService.getTelemetry() });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Submit intent
app.post('/api/intents', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, prompt, dryRun } = body;

    if (!walletAddress || !prompt) {
      return c.json({ error: 'walletAddress and prompt are required' }, 400);
    }

    const result = await processUserIntent(walletAddress, prompt, !!dryRun);
    return c.json(result);
  } catch (error: any) {
    console.error('🔴 Intent execution error:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
  }
});

// Confirm intent execution from draft blueprint
app.post('/api/intents/:id/confirm', async (c) => {
  const id = c.req.param('id');
  try {
    const intent = await db.query.intents.findFirst({
      where: eq(intents.id, id),
    });

    if (!intent) {
      return c.json({ error: 'Intent draft not found' }, 404);
    }

    // Read policy overrides from body if provided
    let policyOverrides = {};
    try {
      const body = await c.req.json();
      if (body && body.policies) {
        policyOverrides = body.policies;
      }
    } catch (_) {
      // Empty or invalid body, ignore
    }

    const mergedPolicies = {
      ...(intent.policies || {}),
      ...policyOverrides,
    };

    const isGuardrail = intent.type === 'defensive_guardrail';
    const nextTime = isGuardrail ? new Date() : null;

    // Fetch telemetry to set TVL baselines dynamically if tvl_drop is used
    const telemetry = oracleService.getTelemetry();
    let updatedRules = intent.conditionalRules ? [...intent.conditionalRules] : null;
    if (updatedRules) {
      for (const rule of updatedRules) {
        for (const cond of rule.conditions) {
          if (cond.type === 'tvl_drop' && cond.params && !cond.params.baselineTvlUsd) {
            const protocolId = (cond.params.protocol || '').toLowerCase();
            const currentProto = telemetry.protocols.find(p => p.id === protocolId);
            if (currentProto) {
              cond.params.baselineTvlUsd = currentProto.tvlUsd;
              console.log(`📡 Dynamically captured TVL baseline for ${protocolId}: $${(currentProto.tvlUsd/1000000).toFixed(2)}M`);
            }
          }
        }
      }
    }

    // Activate intent in DB
    await db.update(intents).set({
      status: 'active',
      nextExecution: nextTime,
      createdAt: new Date(),
      conditionalRules: updatedRules,
      policies: mergedPolicies,
    }).where(eq(intents.id, id));

    // Record intent on-chain in IntentStorage contract
    try {
      const intentContentHash = keccak256(toBytes(JSON.stringify(intent.goal || {})));
      await recordOnChainIntent(id, intent.userWallet, intentContentHash, 'active');
    } catch (err: any) {
      console.warn(`⚠️ On-chain intent logging failed: ${err.message}`);
    }

    // Clear previous audit logs for draft, start fresh
    await db.delete(auditLogs).where(eq(auditLogs.intentId, id));
    await db.insert(auditLogs).values({
      intentId: id,
      event: 'intent_received',
      details: { goal: intent.goal, policies: mergedPolicies },
    });

    const updatedIntentRecord = {
      ...intent,
      policies: mergedPolicies,
      conditionalRules: updatedRules,
      status: 'active',
      nextExecution: nextTime,
    };

    if (isGuardrail) {
      console.log(`📡 Activated guardrail intent ${id}. Daemon monitoring...`);
      return c.json({
        intentId: id,
        status: 'active',
        isGuardrail: true,
        message: 'Defensive guardrail activated successfully. Monitoring telemetry...',
      });
    }

    // Standard immediate execution
    const result = await executeIntent(updatedIntentRecord, intent.goal?.description || '');
    return c.json(result);
  } catch (error: any) {
    console.error('🔴 Intent confirmation error:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
  }
});

// Get single intent details + audit logs
app.get('/api/intents/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const intent = await db.query.intents.findFirst({
      where: eq(intents.id, id),
    });

    if (!intent) {
      return c.json({ error: 'Intent not found' }, 404);
    }

    const logs = await db.select().from(auditLogs).where(eq(auditLogs.intentId, id));

    return c.json({ intent, auditLogs: logs });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// List all intents for a wallet — uses supabaseAdmin (HTTPS) to avoid TCP pooler issuess
app.get('/api/intents', async (c) => {
  const wallet = c.req.query('wallet');
  try {
    if (supabaseAdmin) {
      let q = supabaseAdmin.from('intents').select('*').order('created_at', { ascending: false });
      if (wallet) q = q.eq('user_wallet', wallet);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return c.json(data ?? []);
    }
    // Fallback to Drizzle
    if (wallet) {
      const results = await db.query.intents.findMany({
        where: eq(intents.userWallet, wallet),
        orderBy: desc(intents.createdAt),
      });
      return c.json(results);
    }
    const results = await db.select().from(intents).orderBy(desc(intents.createdAt));
    return c.json(results);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// List agents — uses supabaseAdmin (HTTPS) to avoid TCP pooler issues
app.get('/api/agents', async (c) => {
  try {
    const cachedAgents = await redis.get('agents:list').catch(() => null);
    if (cachedAgents) {
      console.log('⚡ Cache hit: agents list');
      return c.json(JSON.parse(cachedAgents));
    }

    let results: any[];
    if (supabaseAdmin) {
      console.log('⚡ Cache miss: fetching agents via supabaseAdmin');
      const { data, error } = await supabaseAdmin
        .from('agents')
        .select('*')
        .order('reputation_score', { ascending: false });
      if (error) throw new Error(error.message);
      results = data ?? [];
    } else {
      console.log('⚡ Cache miss: fetching agents via Drizzle');
      results = await db.select().from(agents).orderBy(desc(agents.reputationScore));
    }

    await redis.setex('agents:list', 60, JSON.stringify(results)).catch(() => {});
    return c.json(results);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Register or update specialist agent on-chain and in DB
app.post('/api/agents', async (c) => {
  try {
    const body = await c.req.json();
    const { id, walletAddress, name, capabilities, endpoint } = body;

    if (!id || !walletAddress || !name || !capabilities || !endpoint) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // 1. Submit transaction on-chain to AgentRegistry contract
    let onChainTxHash = '';
    try {
      onChainTxHash = await registerOnChainAgent(id, walletAddress, endpoint);
    } catch (err: any) {
      console.warn(`⚠️ On-chain registry write failed or agent already exists: ${err.message}`);
      // Continue to database insert even if already registered on-chain
    }

    // 2. Insert or update in database
    const [insertedAgent] = await db.insert(agents).values({
      id,
      walletAddress,
      name,
      capabilities,
      endpoint,
      reputationScore: '90.00',
      successRatePct: '100.00',
      totalVolumeUsd: '0.00',
      active: true,
    }).onConflictDoUpdate({
      target: agents.id,
      set: {
        walletAddress,
        name,
        capabilities,
        endpoint,
        updatedAt: new Date(),
      }
    }).returning();

    // Invalidate Redis cache
    await redis.del('agents:list').catch((err) => {
      console.error('⚠️ Redis cache clear error:', err);
    });

    return c.json({ success: true, agent: insertedAgent, onChainTx: onChainTxHash });
  } catch (error: any) {
    console.error('🔴 Register agent error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Trigger database seed manually
app.post('/api/seed', async (c) => {
  try {
    // Dynamically trigger seed script
    const proc = Bun.spawn(['bun', 'run', '../../packages/database/seed/index.ts'], {
      env: process.env,
    });
    const stdout = await new Response(proc.stdout).text();
    
    // Invalidate Redis cache
    await redis.del('agents:list').catch((err) => {
      console.error('⚠️ Redis cache clear error:', err);
    });

    return c.json({ success: true, stdout });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Global Error Handler
app.onError((err, c) => {
  console.error('🔴 Global error:', err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// 404 Not Found Handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: `Route not found: ${c.req.path}` }, 404);
});

function checkIntentConditions(intent: any): boolean {
  if (!intent.conditionalRules || !Array.isArray(intent.conditionalRules) || intent.conditionalRules.length === 0) {
    return true; // No conditions, standard recurring execution
  }

  const telemetry = oracleService.getTelemetry();
  
  for (const rule of intent.conditionalRules) {
    let allConditionsMet = true;

    for (const cond of rule.conditions) {
      const { type, params } = cond;

      if (type === 'tvl_drop') {
        const protocolId = (params.protocol || '').toLowerCase();
        const thresholdPct = params.thresholdPct || 10;
        const currentProto = telemetry.protocols.find(p => p.id === protocolId);
        
        if (currentProto) {
          const baseline = params.baselineTvlUsd || (protocolId === 'aave' ? 150000000 : 85000000);
          const limit = baseline * (1 - thresholdPct / 100);
          if (currentProto.tvlUsd > limit) {
            allConditionsMet = false;
          } else {
            console.log(`📡 Alert: TVL drop triggered for ${params.protocol}. Current: $${(currentProto.tvlUsd / 1000000).toFixed(2)}M, Baseline: $${(baseline / 1000000).toFixed(2)}M (Limit: $${(limit / 1000000).toFixed(2)}M)`);
          }
        } else {
          allConditionsMet = false;
        }
      } 
      else if (type === 'token_depeg') {
        const tokenSymbol = (params.token || '').toUpperCase();
        const pegLimit = params.pegLimit || 0.985;
        const currentTok = telemetry.tokens.find(t => t.symbol === tokenSymbol);

        if (currentTok) {
          if (currentTok.priceUsd > pegLimit) {
            allConditionsMet = false;
          } else {
            console.log(`📡 Alert: Token depeg triggered for ${params.token}. Current: $${currentTok.priceUsd.toFixed(4)}, Peg Limit: $${pegLimit}`);
          }
        } else {
          allConditionsMet = false;
        }
      }
      else if (type === 'gas_threshold') {
        const chainName = (params.chain || 'ethereum').toLowerCase();
        const gasLimit = params.gasLimitGwei || 20;
        const currentChain = telemetry.chains.find(c => c.name === chainName);

        if (currentChain) {
          if (currentChain.gasPriceGwei > gasLimit) {
            allConditionsMet = false;
          } else {
            console.log(`📡 Alert: Gas threshold triggered for ${chainName}. Current: ${currentChain.gasPriceGwei} gwei, Limit: ${gasLimit} gwei`);
          }
        } else {
          allConditionsMet = false;
        }
      }
      else if (type === 'time_schedule') {
        const now = new Date();
        const targetDay = (params.schedule || '').toLowerCase(); // e.g. 'monday'
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayName = days[now.getDay()];
        if (targetDay && currentDayName !== targetDay) {
          allConditionsMet = false;
        } else {
          console.log(`📡 Alert: Time schedule triggered for ${targetDay}. Current day: ${currentDayName}`);
        }
      }
    }

    if (allConditionsMet) {
      return true; // Triggers if any rule has all its conditions met
    }
  }

  return false;
}

// Start recurring intents background scheduler
// Uses supabaseAdmin (HTTPS) instead of direct Postgres to avoid TCP pooler issues
setInterval(async () => {
  try {
    if (!supabaseAdmin) return; // Skip if no service role key
    const now = new Date();

    const { data: pendingIntents, error } = await supabaseAdmin
      .from('intents')
      .select('*')
      .eq('status', 'active')
      .eq('is_recurring', true)
      .or(`next_execution.lte.${now.toISOString()},next_execution.is.null`);

    if (error) {
      console.error('⚠️ Scheduler DB error:', error.message);
      return;
    }

    for (const intent of pendingIntents ?? []) {
      if (!checkIntentConditions(intent)) {
        const retryTime = new Date(Date.now() + 5000).toISOString();
        await supabaseAdmin.from('intents').update({ next_execution: retryTime }).eq('id', intent.id);
        continue;
      }

      console.log(`⏱️ Scheduler: Running recurring intent ${intent.id}...`);

      const isGuardrail = intent.type === 'defensive_guardrail';
      const nextTime = new Date(Date.now() + (isGuardrail ? 15000 : 60000)).toISOString();
      await supabaseAdmin.from('intents').update({ next_execution: nextTime }).eq('id', intent.id);

      executeIntent(intent, intent.goal?.description || 'Recurring execution')
        .then(() => console.log(`⏱️ Scheduler: Completed execution for intent ${intent.id}`))
        .catch((err: Error) => console.error(`⏱️ Scheduler: Failed execution for intent ${intent.id}:`, err));
    }
  } catch (err) {
    console.error('⚠️ Scheduler error:', err);
  }
}, 15000); // Check every 15 seconds

const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
console.log(`🚀 Helix API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
