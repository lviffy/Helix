import { db } from '@helix/database/client';
import { intents, tasks, bids, auditLogs, users } from '@helix/database/schema';
import { eq } from 'drizzle-orm';
import { parseIntent, planExecution, explainExecution } from '@helix/ai';
import { getAgentBids } from '../agents/mockSpecialists';
import { evaluateBids } from './decision';

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

  // 4. AI Planning (DAG Plan)
  const executionPlan = await planExecution(parsedIntent);
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
      const [insertedBid] = await db.insert(bids).values({
        taskId: task.id,
        agentId: bidVal.agentId,
        feeUsd: bidVal.feeUsd.toString(),
        etaSeconds: bidVal.etaSeconds,
        confidence: bidVal.confidence.toString(),
        protocolRiskScore: bidVal.protocolRiskScore,
        slippageEstimatedPct: bidVal.slippageEstimatedPct.toString(),
        reputationScore: bidVal.reputationScore.toString(),
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

    // Set winner
    const winningBid = insertedBids.find((b) => b.agentId === evaluation.selectedAgentId)!;
    await db.update(bids).set({ status: 'accepted' }).where(eq(bids.id, winningBid.id));
    await db.update(tasks).set({
      winningAgentId: evaluation.selectedAgentId,
      bidAmount: winningBid.feeUsd,
      status: 'executing',
    }).where(eq(tasks.id, task.id));

    await logAudit(dbIntent.id, 'agent_selected', {
      taskId: task.id,
      selectedAgentId: evaluation.selectedAgentId,
      reasoning: evaluation.reasoning,
      evaluations: evaluation.evaluations,
    });

    // Escrow simulation
    const escrowAmount = 1.0; // Simulate native gas or transaction locked funds
    await logAudit(dbIntent.id, 'escrow_locked', {
      taskId: task.id,
      agentId: evaluation.selectedAgentId,
      amountLockedEth: escrowAmount,
    });

    // Simulate Execution delay + Tx hash
    const txHash = `0x${Math.random().toString(16).substr(2, 40)}`;
    
    // Verification simulation
    await logAudit(dbIntent.id, 'execution_completed', {
      taskId: task.id,
      agentId: evaluation.selectedAgentId,
      txHash,
    });

    await logAudit(dbIntent.id, 'verification_passed', {
      taskId: task.id,
      txHash,
      proof: 'balance_increase_detected_on_chain',
    });

    // Payout and Release escrow
    await logAudit(dbIntent.id, 'escrow_released', {
      taskId: task.id,
      payoutAmountEth: escrowAmount,
      feeAccruedEth: escrowAmount * 0.005, // 0.5% coordinator fee
    });

    // Update task completed
    await db.update(tasks).set({
      status: 'completed',
      txHash,
    }).where(eq(tasks.id, task.id));

    finalLogs.push({
      taskName: task.name,
      agentId: evaluation.selectedAgentId,
      txHash,
      feePaid: winningBid.feeUsd,
    });
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
