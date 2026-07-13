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
  requireExitGuard: z.boolean().default(true),
});

export const ExecutionConstraintsSchema = z.object({
  maxSlippagePct: z.number().default(0.5),
  maxGasPerTxUsd: z.number().default(5),
  approvalThresholdUsd: z.number().default(1000),
  maxExitSlippagePct: z.number().default(1.0),
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

export const ConditionSchema = z.object({
  type: z.enum(['tvl_drop', 'token_depeg', 'gas_threshold', 'time_schedule']).describe('The condition type trigger'),
  params: z.object({
    protocol: z.string().optional().describe('Protocol to monitor (e.g., Aave, Compound)'),
    thresholdPct: z.number().optional().describe('Percentage drop threshold (e.g., 10 for 10% drop)'),
    timeWindowHours: z.number().optional().describe('Time window in hours'),
    token: z.string().optional().describe('Token to monitor depeg for (e.g. USDC, USDT)'),
    pegLimit: z.number().optional().describe('Minimum peg value (e.g. 0.985)'),
    gasLimitGwei: z.number().optional().describe('Maximum gas limit in gwei (e.g. 20)'),
    chain: z.string().optional().describe('Blockchain to monitor (e.g. ethereum, base, xlayer)'),
    schedule: z.string().optional().describe('Schedule string or day (e.g. Monday)'),
  }).describe('Parameters required to check the condition'),
});

export const ConditionalRuleSchema = z.object({
  conditions: z.array(ConditionSchema).min(1).describe('The set of conditions that must trigger this rule'),
  action: z.enum(['withdraw', 'bridge', 'deposit', 'rebalance', 'swap', 'notify']).describe('The action to execute if conditions are met'),
  actionParams: z.object({
    asset: z.string().optional(),
    amount: z.number().optional(),
    sourceChain: z.string().optional(),
    targetChain: z.string().optional(),
    protocol: z.string().optional(),
  }).optional().describe('Override parameters for the action'),
});

export const IntentSchema = z.object({
  type: z.enum(['yield_optimization', 'portfolio_rebalancing', 'cross_chain_transfer', 'defensive_guardrail']).describe('The classified category of the user intent'),
  goal: GoalSchema,
  policies: PolicySchema,
  isRecurring: z.boolean().default(false),
  conditionalRules: z.array(ConditionalRuleSchema).optional().describe('Optional list of active monitoring rules'),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;
export type ParsedAsset = z.infer<typeof AssetSchema>;
export type ParsedPolicy = z.infer<typeof PolicySchema>;
export type ParsedCondition = z.infer<typeof ConditionSchema>;
export type ParsedConditionalRule = z.infer<typeof ConditionalRuleSchema>;
