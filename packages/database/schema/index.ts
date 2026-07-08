import { pgTable, text, timestamp, boolean, jsonb, decimal, integer, uuid } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  walletAddress: text('wallet_address').primaryKey(),
  policyProfile: jsonb('policy_profile').$type<{
    minProtocolRiskScore?: number;
    minTvlUsd?: number;
    maxGasPerTxUsd?: number;
    approvalThresholdUsd?: number;
    avoidProtocols?: string[];
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Agents table
export const agents = pgTable('agents', {
  id: text('id').primaryKey(), // e.g., 'stargate-bridge-agent'
  walletAddress: text('wallet_address').notNull(),
  name: text('name').notNull(),
  capabilities: jsonb('capabilities').$type<string[]>().notNull(),
  endpoint: text('endpoint').notNull(),
  reputationScore: decimal('reputation_score', { precision: 5, scale: 2 }).default('90.00').notNull(),
  successRatePct: decimal('success_rate_pct', { precision: 5, scale: 2 }).default('100.00').notNull(),
  totalVolumeUsd: decimal('total_volume_usd', { precision: 15, scale: 2 }).default('0.00').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Intents table
export const intents = pgTable('intents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userWallet: text('user_wallet').references(() => users.walletAddress).notNull(),
  type: text('type').notNull(), // yield_optimization, portfolio_rebalancing, cross_chain_transfer
  status: text('status').default('active').notNull(), // active, paused, completed, failed
  goal: jsonb('goal').$type<{
    description: string;
    assets: Array<{
      symbol: string;
      amount: number;
      sourceChain: string;
    }>;
    targetChains: string[];
    yieldTargetApy?: number;
    rebalanceFrequency?: string;
  }>().notNull(),
  policies: jsonb('policies').$type<{
    requireAudit?: boolean;
    minTvlUsd?: number;
    maxSlippagePct?: number;
    maxGasPerTxUsd?: number;
    preferenceOrder?: string[];
  }>().notNull(),
  isRecurring: boolean('is_recurring').default(false).notNull(),
  nextExecution: timestamp('next_execution'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table (DAG components of an intent)
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  intentId: uuid('intent_id').references(() => intents.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // check_balances, bridge, deposit
  status: text('status').default('pending').notNull(), // pending, bidding, executing, completed, failed
  dependencies: jsonb('dependencies').$type<string[]>().default([]).notNull(), // task UUIDs that this task depends on
  winningAgentId: text('winning_agent_id').references(() => agents.id),
  bidAmount: decimal('bid_amount', { precision: 15, scale: 6 }),
  txHash: text('tx_hash'),
  errorReason: text('error_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bids table (Agent bids for tasks)
export const bids = pgTable('bids', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  agentId: text('agent_id').references(() => agents.id).notNull(),
  feeUsd: decimal('fee_usd', { precision: 10, scale: 4 }).notNull(),
  etaSeconds: integer('eta_seconds').notNull(),
  confidence: decimal('confidence', { precision: 4, scale: 3 }).notNull(),
  protocolRiskScore: integer('protocol_risk_score').notNull(),
  slippageEstimatedPct: decimal('slippage_estimated_pct', { precision: 5, scale: 4 }).notNull(),
  reputationScore: decimal('reputation_score', { precision: 5, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(), // pending, accepted, rejected
  reasoning: text('reasoning'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  intentId: uuid('intent_id').references(() => intents.id, { onDelete: 'cascade' }).notNull(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  event: text('event').notNull(), // intent_received, bids_received, agent_selected, execution_completed, etc.
  details: jsonb('details').notNull(), // JSON metadata
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
