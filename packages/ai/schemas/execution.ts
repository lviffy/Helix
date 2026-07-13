import { z } from 'zod';

export const TaskNodeSchema = z.object({
  id: z.string().describe('Unique identifier for this task in the plan'),
  name: z.enum(['check_balances', 'bridge', 'deposit', 'rebalance', 'withdraw', 'swap', 'check_gas', 'check_tvl', 'check_depeg', 'check_exit_liquidity']).describe('Name/type of the execution action'),
  dependencies: z.array(z.string()).describe('List of task IDs that must be completed before this task can start'),
  params: z.object({
    asset: z.string().optional(),
    amount: z.number().optional(),
    sourceChain: z.string().optional(),
    targetChain: z.string().optional(),
    targetApy: z.number().optional(),
    protocol: z.string().optional(),
    conditionType: z.string().optional(),
    conditionParams: z.record(z.any()).optional(),
  }).describe('Parameters required by the agent for task execution'),
});

export const ExecutionPlanSchema = z.object({
  tasks: z.array(TaskNodeSchema).min(1).describe('The list of tasks in the generated Directed Acyclic Graph (DAG)'),
});

export type TaskNode = z.infer<typeof TaskNodeSchema>;
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;
