import { z } from 'zod';

export const AssetSchema = z.object({
  symbol: z.string().describe('Token symbol, e.g., USDC, USDT, ETH'),
  amount: z.number().positive().describe('Amount of token to allocate'),
  sourceChain: z.string().describe('Source blockchain where asset is currently located'),
});

export const GoalSchema = z.object({
  description: z.string().describe('Plain English description of user financial goal'),
  assets: z.array(AssetSchema).min(1),
  targetChains: z.array(z.string()).min(1).describe('Target blockchains for execution, e.g., ethereum, base, xlayer'),
  yieldTargetApy: z.number().optional().describe('Target APY fraction (e.g. 0.08 for 8%)'),
  rebalanceFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'none']).optional().default('none'),
});

export const ProtocolConstraintsSchema = z.object({
  requireAudit: z.boolean().default(true),
  minTvlUsd: z.number().optional().default(50000000),
  avoidProtocols: z.array(z.string()).default([]),
});

export const ExecutionConstraintsSchema = z.object({
  maxSlippagePct: z.number().default(0.5),
  maxGasPerTxUsd: z.number().default(5),
  approvalThresholdUsd: z.number().default(1000),
});

export const RiskPreferencesSchema = z.object({
  preferenceOrder: z.array(z.enum(['safety', 'yield', 'cost'])).default(['safety', 'yield', 'cost']),
  pauseOnMarketVolatility: z.boolean().default(true),
});

export const PolicySchema = z.object({
  protocolConstraints: ProtocolConstraintsSchema,
  executionConstraints: ExecutionConstraintsSchema,
  riskPreferences: RiskPreferencesSchema,
});

export const IntentSchema = z.object({
  type: z.enum(['yield_optimization', 'portfolio_rebalancing', 'cross_chain_transfer']).describe('The classified category of the user intent'),
  goal: GoalSchema,
  policies: PolicySchema,
  isRecurring: z.boolean().default(false),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;
export type ParsedAsset = z.infer<typeof AssetSchema>;
export type ParsedPolicy = z.infer<typeof PolicySchema>;
