import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '@helix/database/client';
import { intents, agents, auditLogs } from '@helix/database/schema';
import { eq, desc } from 'drizzle-orm';
import { processUserIntent } from './orchestrator/core';
import { authMiddleware } from './middleware/auth';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Protect intents routes
app.use('/api/intents*', authMiddleware);

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'Helix Core Backend API', timestamp: new Date() });
});

// Submit intent
app.post('/api/intents', async (c) => {
  try {
    const body = await c.req.json();
    const { walletAddress, prompt } = body;

    if (!walletAddress || !prompt) {
      return c.json({ error: 'walletAddress and prompt are required' }, 400);
    }

    const result = await processUserIntent(walletAddress, prompt);
    return c.json(result);
  } catch (error: any) {
    console.error('🔴 Intent execution error:', error);
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

// List all intents for a wallet
app.get('/api/intents', async (c) => {
  const wallet = c.req.query('wallet');
  try {
    let query = db.select().from(intents).orderBy(desc(intents.createdAt));
    if (wallet) {
      // Find intents by wallet
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

// List agents
app.get('/api/agents', async (c) => {
  try {
    const results = await db.select().from(agents).orderBy(desc(agents.reputationScore));
    return c.json(results);
  } catch (error: any) {
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
    return c.json({ success: true, stdout });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
console.log(`🚀 Helix API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
