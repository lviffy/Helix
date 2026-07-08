import { db } from '@helix/database/client';
import { intents, tasks, bids, auditLogs, users, agents } from '@helix/database/schema';
import { eq } from 'drizzle-orm';
import { parseIntent, planExecution, explainExecution } from '@helix/ai';
import { getAgentBids } from '../agents/mockSpecialists';
import { evaluateBids } from './decision';
import { getOnChainReputation, createOnChainEscrow, releaseOnChainEscrow, refundOnChainEscrow } from '../blockchain/blockchainService';

export interface ProcessIntentResult {
  intentId: string;
  plan: any;
  auditTrail: any[];
  explanation: any;
}

export async function processUserIntent(
  userWallet: string,
  rawIntentPrompt: string
): Promise<ProcessIntentResult> {
  console.log(`🌀 Orchestrator: Processing intent for wallet ${userWallet}...`);

  // 1. Fetch user policy profile or create default
  let userProfile = await db.query.users.findFirst({
    where: eq(users.walletAddress, userWallet),
  });

  if (!userProfile) {
    // Insert default user profile
    await db.insert(users).values({
      walletAddress: userWallet,
      policyProfile: {
        minProtocolRiskScore: 75,
        minTvlUsd: 50000000,
        maxGasPerTxUsd: 5,
        approvalThresholdUsd: 1000,
        avoidProtocols: [],
      },
    });
    userProfile = {
      walletAddress: userWallet,
      policyProfile: {
        minProtocolRiskScore: 75,
        minTvlUsd: 50000000,
        maxGasPerTxUsd: 5,
        approvalThresholdUsd: 1000,
        avoidProtocols: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 2. AI Parsing (NL -> JSON)
  const parsedIntent = await parseIntent(rawIntentPrompt);
  console.log(`✅ Parser output: ${JSON.stringify(parsedIntent, null, 2)}`);

  // 3. Save intent to DB
  const [dbIntent] = await db.insert(intents).values({
    userWallet,
    type: parsedIntent.type,
    status: 'active',
    goal: parsedIntent.goal,
    policies: parsedIntent.policies,
    isRecurring: parsedIntent.isRecurring,
  }).returning();

  await logAudit(dbIntent.id, 'intent_received', { parsedIntent });

  return executeIntent(dbIntent, rawIntentPrompt);
}

export async function executeIntent(
  dbIntent: any,
  rawIntentPrompt: string
): Promise<ProcessIntentResult> {
  // 4. AI Planning (DAG Plan)
  const executionPlan = await planExecution({
    type: dbIntent.type,
    goal: dbIntent.goal,
    policies: dbIntent.policies,
  } as any);
  console.log(`✅ Plan output: ${JSON.stringify(executionPlan, null, 2)}`);

  await logAudit(dbIntent.id, 'plan_generated', { executionPlan });

  // 5. Save planned tasks
  const dbTasksMap = new Map<string, string>(); // maps temp plan task ID -> DB uuid
  
  for (const task of executionPlan.tasks) {
    const [insertedTask] = await db.insert(tasks).values({
      intentId: dbIntent.id,
      name: task.name,
      status: 'pending',
      dependencies: task.dependencies, // will replace with real uuids next
    }).returning();
    dbTasksMap.set(task.id, insertedTask.id);
  }

  // Update dependencies mapping with real database UUIDs
  const dbTasks = await db.select().from(tasks).where(eq(tasks.intentId, dbIntent.id));
  for (const task of dbTasks) {
    const updatedDeps = (task.dependencies as string[] || []).map((depId) => dbTasksMap.get(depId) || depId);
    await db.update(tasks).set({
      dependencies: updatedDeps,
    }).where(eq(tasks.id, task.id));
  }

  // 6. Execute DAG Tasks
  console.log(`⚡ Executing tasks DAG...`);
  const finalLogs: any[] = [];

  for (const task of dbTasks) {
    console.log(`📍 Task: ${task.name} (${task.id})`);
    
    // Mark as bidding
    await db.update(tasks).set({ status: 'bidding' }).where(eq(tasks.id, task.id));
    await logAudit(dbIntent.id, 'bids_requested', { taskId: task.id, taskName: task.name });

    // Request agent bids
    // We map back to AI TaskNode format for Specialists helper
    const aiTaskNode = {
      id: task.id,
      name: task.name as any,
      dependencies: task.dependencies as string[],
      params: {},
    };
    const mockBids = getAgentBids(aiTaskNode);

    // Insert bids into DB
    const insertedBids = [];
    for (const bidVal of mockBids) {
      const onChainRep = await getOnChainReputation(bidVal.agentId);
      console.log(`⛓️ Blockchain: Agent ${bidVal.agentId} has on-chain reputation ${onChainRep}%`);

      const [insertedBid] = await db.insert(bids).values({
        taskId: task.id,
        agentId: bidVal.agentId,
        feeUsd: bidVal.feeUsd.toString(),
        etaSeconds: bidVal.etaSeconds,
        confidence: bidVal.confidence.toString(),
        protocolRiskScore: bidVal.protocolRiskScore,
        slippageEstimatedPct: bidVal.slippageEstimatedPct.toString(),
        reputationScore: onChainRep.toString(),
        status: 'pending',
      }).returning();
      insertedBids.push(insertedBid);
    }

    await logAudit(dbIntent.id, 'bids_received', { taskId: task.id, bids: insertedBids });

    // Score bids using Decision Engine
    const evaluation = evaluateBids(
      insertedBids,
      dbIntent.policies as any
    );

    console.log(`🎯 Decision result: ${evaluation.reasoning}`);

    if (!evaluation.selectedAgentId) {
      // Fail task and stop orchestration
      await db.update(tasks).set({
        status: 'failed',
        errorReason: 'No bidding agent qualified for policy filters',
      }).where(eq(tasks.id, task.id));

      await logAudit(dbIntent.id, 'execution_failed', {
        taskId: task.id,
        reason: 'No bidding agent qualified for policy filters',
      });

      await db.update(intents).set({ status: 'failed' }).where(eq(intents.id, dbIntent.id));
      throw new Error(`Orchestration aborted: Task ${task.name} failed. Reason: ${evaluation.reasoning}`);
    }

    // Set winner and execute with potential failure injection & rerouting
    const winningBid = insertedBids.find((b) => b.agentId === evaluation.selectedAgentId)!;
    await db.update(bids).set({ status: 'accepted' }).where(eq(bids.id, winningBid.id));
    
    await logAudit(dbIntent.id, 'agent_selected', {
      taskId: task.id,
      selectedAgentId: evaluation.selectedAgentId,
      reasoning: evaluation.reasoning,
      evaluations: evaluation.evaluations,
    });

    let taskCompleted = false;
    let attempts = 0;
    let selectedAgentId: string | null = evaluation.selectedAgentId;
    let currentBid = winningBid;
    const evaluatedBidsList = [...evaluation.evaluations]; // copy of evaluations

    while (!taskCompleted && selectedAgentId) {
      attempts++;
      console.log(`⚡ Execution attempt ${attempts} using agent: ${selectedAgentId}`);
      
      // Update task record with current executing agent
      await db.update(tasks).set({
        winningAgentId: selectedAgentId,
        bidAmount: currentBid.feeUsd,
        status: 'executing',
      }).where(eq(tasks.id, task.id));

      // Unique taskId for on-chain mapping to satisfy Escrow.sol uniqueness constraints
      const escrowTaskId = attempts === 1 ? task.id : `${task.id}-attempt-${attempts}`;

      // 1. Escrow Lock on-chain
      const escrowAmountEth = '0.01'; // MVP locks 0.01 ETH in local Anvil
      const escrowTxHash = await createOnChainEscrow(
        escrowTaskId,
        selectedAgentId,
        escrowAmountEth,
        3600 // 1 hour timeout
      );

      await logAudit(dbIntent.id, 'escrow_locked', {
        taskId: task.id,
        agentId: selectedAgentId,
        amountLockedEth: escrowAmountEth,
        txHash: escrowTxHash,
        attempt: attempts,
      });

      // 2. Simulate Execution & Check for injected failure
      // Trigger failure if intent prompt contains 'fail' and agent is compound-yield-agent or aave-yield-agent
      // Only inject failure on the first attempt so that the task successfully reroutes and completes on the second attempt.
      const injectFailure = rawIntentPrompt.toLowerCase().includes('fail') && attempts === 1 && (selectedAgentId === 'compound-yield-agent' || selectedAgentId === 'aave-yield-agent');
      
      if (injectFailure) {
        console.log(`⚠️ Failure Injected: Simulating execution failure for agent ${selectedAgentId}...`);
        
        await logAudit(dbIntent.id, 'execution_failed', {
          taskId: task.id,
          agentId: selectedAgentId,
          reason: 'Execution returned high slippage above policy thresholds',
        });

        // Slash and refund on-chain
        const refundTxHash = await refundOnChainEscrow(escrowTaskId);
        
        await logAudit(dbIntent.id, 'escrow_refunded', {
          taskId: task.id,
          agentId: selectedAgentId,
          reason: 'Slashed for execution failure',
          txHash: refundTxHash,
        });

        // Update agent stats on failure
        await updateAgentStats(selectedAgentId, false, 0);

        // Remove failed agent from list of valid options
        const failedIndex = evaluatedBidsList.findIndex((e) => e.agentId === selectedAgentId);
        if (failedIndex !== -1) {
          evaluatedBidsList[failedIndex].rejected = true;
          evaluatedBidsList[failedIndex].reason = 'Failed execution attempt';
        }

        // Find the next best candidate
        const nextBids = evaluatedBidsList.filter((e) => !e.rejected).sort((a, b) => b.score - a.score);
        if (nextBids.length > 0) {
          const previousAgentId = selectedAgentId;
          selectedAgentId = nextBids[0].agentId;
          currentBid = insertedBids.find((b) => b.agentId === selectedAgentId)!;
          await logAudit(dbIntent.id, 'rerouting_task', {
            taskId: task.id,
            previousAgentId,
            newAgentId: selectedAgentId,
          });
        } else {
          // No more agents
          selectedAgentId = null;
        }
      } else {
        // Success execution path
        const txHash = `0x${Math.random().toString(16).substr(2, 40)}`;
        
        await logAudit(dbIntent.id, 'execution_completed', {
          taskId: task.id,
          agentId: selectedAgentId,
          txHash,
        });

        await logAudit(dbIntent.id, 'verification_passed', {
          taskId: task.id,
          txHash,
          proof: 'balance_increase_detected_on_chain',
        });

        // Release escrow on-chain
        const releaseTxHash = await releaseOnChainEscrow(escrowTaskId);

        await logAudit(dbIntent.id, 'escrow_released', {
          taskId: task.id,
          payoutAmountEth: escrowAmountEth,
          feeAccruedEth: (parseFloat(escrowAmountEth) * 0.005).toFixed(5), // 0.5% coordinator fee
          txHash: releaseTxHash,
        });

        await db.update(tasks).set({
          status: 'completed',
          txHash,
        }).where(eq(tasks.id, task.id));

        // Update agent stats on success
        await updateAgentStats(selectedAgentId, true, parseFloat(currentBid.feeUsd || '0'));

        finalLogs.push({
          taskName: task.name,
          agentId: selectedAgentId,
          txHash,
          feePaid: currentBid.feeUsd,
        });

        taskCompleted = true;
      }
    }

    if (!taskCompleted) {
      await db.update(tasks).set({
        status: 'failed',
        errorReason: 'All selected agents failed execution and were slashed.',
      }).where(eq(tasks.id, task.id));

      await db.update(intents).set({ status: 'failed' }).where(eq(intents.id, dbIntent.id));
      throw new Error(`Orchestration aborted: Task ${task.name} failed all execution attempts.`);
    }
  }

  // 7. Complete Intent
  await db.update(intents).set({ status: 'completed' }).where(eq(intents.id, dbIntent.id));

  // 8. Generate plain-English explanation via Gemini Explainability Engine
  const dbLogs = await db.select().from(auditLogs).where(eq(auditLogs.intentId, dbIntent.id));
  const explanation = await explainExecution(dbIntent, dbLogs);
  
  await logAudit(dbIntent.id, 'explainability_generated', { explanation });

  console.log(`🎉 Intent Settlement finished successfully!`);

  return {
    intentId: dbIntent.id,
    plan: executionPlan,
    auditTrail: dbLogs,
    explanation,
  };
}

async function logAudit(intentId: string, eventName: string, details: Record<string, any>) {
  await db.insert(auditLogs).values({
    intentId,
    event: eventName,
    details,
  });
}

async function updateAgentStats(agentId: string, success: boolean, volumeUsd: number) {
  try {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, agentId),
    });

    if (!agent) return;

    const rep = parseFloat(agent.reputationScore);
    const rate = parseFloat(agent.successRatePct);
    const vol = parseFloat(agent.totalVolumeUsd);

    let newRep = success ? Math.min(100, rep + 0.5) : Math.max(0, rep - 5.0);
    let newRate = success ? Math.min(100, rate + 0.1) : Math.max(0, rate - 2.0);
    let newVol = vol + volumeUsd;

    await db.update(agents).set({
      reputationScore: newRep.toFixed(2),
      successRatePct: newRate.toFixed(2),
      totalVolumeUsd: newVol.toFixed(2),
      updatedAt: new Date(),
    }).where(eq(agents.id, agentId));

    console.log(`📈 Updated stats for agent ${agentId}: Rep=${newRep.toFixed(2)}, Vol=$${newVol.toFixed(2)}`);
  } catch (err) {
    console.error('Error updating agent stats:', err);
  }
}
