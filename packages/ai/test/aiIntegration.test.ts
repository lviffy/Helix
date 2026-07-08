import { expect, test, mock, describe } from 'bun:test';
import { parseIntent } from '../parser';
import { planExecution } from '../planner';

// Mock the Gemini gateway calls for testing without an active API key
mock.module('../gateway', () => {
  return {
    generateStructured: async ({ prompt, schema }: any) => {
      // Mock parsing response
      if (prompt.includes('Parse the following')) {
        return {
          type: 'yield_optimization',
          goal: {
            description: 'Maximize stablecoin yield',
            assets: [{ symbol: 'USDC', amount: 5000, sourceChain: 'ethereum' }],
            targetChains: ['ethereum', 'base'],
            yieldTargetApy: 0.08,
            rebalanceFrequency: 'monthly',
          },
          policies: {
            protocolConstraints: { requireAudit: true, minTvlUsd: 50000000, avoidProtocols: [] },
            executionConstraints: { maxSlippagePct: 0.5, maxGasPerTxUsd: 5, approvalThresholdUsd: 1000 },
            riskPreferences: { preferenceOrder: ['safety', 'yield', 'cost'], pauseOnMarketVolatility: true },
          },
          isRecurring: true,
        };
      }
      
      // Mock planning response
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
              name: 'bridge',
              dependencies: ['task_01'],
              params: { asset: 'USDC', amount: 5000, sourceChain: 'ethereum', targetChain: 'base' },
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

describe('Helix AI Module Tests', () => {
  test('should parse natural language intent prompt into structured schema', async () => {
    const rawPrompt = 'Keep my USDC earning the best safe yield. Rebalance monthly.';
    const result = await parseIntent(rawPrompt);

    expect(result.type).toBe('yield_optimization');
    expect(result.goal.assets[0].symbol).toBe('USDC');
    expect(result.isRecurring).toBe(true);
  });

  test('should generate task DAG execution plan from structured intent', async () => {
    const mockIntent: any = {
      type: 'yield_optimization',
      goal: {
        description: 'Maximize stablecoin yield',
        assets: [{ symbol: 'USDC', amount: 5000, sourceChain: 'ethereum' }],
        targetChains: ['ethereum', 'base'],
        yieldTargetApy: 0.08,
        rebalanceFrequency: 'monthly',
      },
      policies: {
        protocolConstraints: { requireAudit: true, minTvlUsd: 50000000, avoidProtocols: [] },
        executionConstraints: { maxSlippagePct: 0.5, maxGasPerTxUsd: 5, approvalThresholdUsd: 1000 },
        riskPreferences: { preferenceOrder: ['safety', 'yield', 'cost'], pauseOnMarketVolatility: true },
      },
      isRecurring: true,
    };

    const plan = await planExecution(mockIntent);

    expect(plan.tasks.length).toBe(3);
    expect(plan.tasks[0].name).toBe('check_balances');
    expect(plan.tasks[1].name).toBe('bridge');
    expect(plan.tasks[2].name).toBe('deposit');
  });
});
