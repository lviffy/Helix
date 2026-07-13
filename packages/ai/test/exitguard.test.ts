import { expect, test, mock, describe } from 'bun:test';
import { planExecution } from '../planner';

// Mock the Gemini gateway calls for testing without an active API key
mock.module('../gateway', () => {
  return {
    generateStructured: async ({ prompt, schema }: any) => {
      // Mock planning response containing ExitGuard check_exit_liquidity node
      if (prompt.includes('Generate an execution plan')) {
        return {
          tasks: [
            {
              id: 'task_01',
              name: 'check_balances',
              dependencies: [],
              params: { asset: 'USDC', sourceChain: 'ethereum' },
            },
            {
              id: 'task_02',
              name: 'check_exit_liquidity',
              dependencies: ['task_01'],
              params: { asset: 'USDC', amount: 5000, targetChain: 'base' },
            },
            {
              id: 'task_03',
              name: 'deposit',
              dependencies: ['task_02'],
              params: { asset: 'USDC', amount: 5000, targetChain: 'base', targetApy: 0.08 },
            },
          ],
        };
      }
      throw new Error('Unknown prompt mock request');
    },
  };
});

describe('ExitGuard DAG Integration Tests', () => {
  test('should generate task DAG execution plan containing check_exit_liquidity pre-trade check', async () => {
    const mockIntent: any = {
      type: 'yield_optimization',
      goal: {
        description: 'Maximize stablecoin yield',
        assets: [{ symbol: 'USDC', amount: 5000, sourceChain: 'ethereum' }],
        targetChains: ['ethereum', 'base'],
      },
      policies: {
        protocolConstraints: { requireExitGuard: true },
        executionConstraints: { maxExitSlippagePct: 1.0 },
      },
    };

    const plan = await planExecution(mockIntent);

    expect(plan.tasks.length).toBe(3);
    expect(plan.tasks[0].name).toBe('check_balances');
    expect(plan.tasks[1].name).toBe('check_exit_liquidity');
    expect(plan.tasks[1].dependencies).toContain('task_01');
    expect(plan.tasks[2].name).toBe('deposit');
    expect(plan.tasks[2].dependencies).toContain('task_02');
  });
});
