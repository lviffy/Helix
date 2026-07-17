import { ai, GEMINI_MODEL } from './client';
import { type ZodType } from 'zod';

export interface GenerateConfig<T> {
  prompt: string;
  systemInstruction?: string;
  schema?: ZodType<T>;
}

// Separate helper for robust structured mock fallback response
function getMockResponse<T>(prompt: string): T {
  // 1. Parsing mock response
  if (prompt.includes('Parse the following')) {
    const isFailedPrompt = prompt.toLowerCase().includes('fail');
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('depeg') || lowerPrompt.includes('falls') || lowerPrompt.includes('guardrail') || lowerPrompt.includes('withdraw')) {
      return {
        type: 'defensive_guardrail',
        goal: {
          description: 'If TVL of Aave falls > 10% or USDC depegs < $0.985, withdraw assets to safety',
          assets: [{ symbol: 'USDC', amount: 5000, sourceChain: 'Base' }],
          targetChains: ['xlayer'],
          yieldTargetApy: 0,
          rebalanceFrequency: 'none',
        },
        policies: {
          requireAudit: true,
          minTvlUsd: 50000000,
          maxSlippagePct: 0.5,
          maxGasPerTxUsd: 5,
          preferenceOrder: ['safety', 'yield', 'cost'],
        },
        isRecurring: true,
        conditionalRules: [
          {
            conditions: [
              { type: 'tvl_drop', params: { protocol: 'Aave', thresholdPct: 10 } },
              { type: 'token_depeg', params: { token: 'USDC', pegLimit: 0.985 } }
            ],
            action: 'withdraw',
            actionParams: { asset: 'USDC', sourceChain: 'Base', targetChain: 'xlayer' }
          }
        ]
      } as unknown as T;
    }
    
    if (lowerPrompt.includes('monday') || lowerPrompt.includes('gas') || lowerPrompt.includes('macro')) {
      return {
        type: 'portfolio_rebalancing',
        goal: {
          description: 'Every Monday, swap 50% yield to ETH, bridge to X Layer, buy OKB if mainnet gas < 20 gwei',
          assets: [{ symbol: 'USDC', amount: 1000, sourceChain: 'Base' }],
          targetChains: ['xlayer'],
          yieldTargetApy: 0,
          rebalanceFrequency: 'weekly',
        },
        policies: {
          requireAudit: true,
          minTvlUsd: 50000000,
          maxSlippagePct: 0.5,
          maxGasPerTxUsd: 5,
          preferenceOrder: ['safety', 'yield', 'cost'],
        },
        isRecurring: true,
        conditionalRules: [
          {
            conditions: [
              { type: 'time_schedule', params: { schedule: 'Monday' } },
              { type: 'gas_threshold', params: { gasLimitGwei: 20, chain: 'ethereum' } }
            ],
            action: 'swap',
            actionParams: { asset: 'OKB', sourceChain: 'Base', targetChain: 'xlayer' }
          }
        ]
      } as unknown as T;
    }

    return {
      type: 'yield_optimization',
      goal: {
        description: isFailedPrompt ? 'Yield Optimization (Failure Injection Demo)' : 'Maximize stablecoin yield',
        assets: [{ symbol: 'USDC', amount: 5000, sourceChain: 'Ethereum' }],
        targetChains: ['Ethereum', 'Base'],
        yieldTargetApy: 0.08,
        rebalanceFrequency: 'monthly',
      },
      policies: {
        requireAudit: true,
        minTvlUsd: 50000000,
        maxSlippagePct: 0.5,
        maxGasPerTxUsd: 5,
        preferenceOrder: ['safety', 'yield', 'cost'],
      },
      isRecurring: true,
    } as unknown as T;
  }
  
  // 2. Planning mock response
  if (prompt.includes('Generate an execution plan')) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('defensive_guardrail') || lowerPrompt.includes('depeg') || lowerPrompt.includes('falls')) {
      return {
        tasks: [
          {
            id: 'task_01',
            name: 'check_tvl',
            dependencies: [],
            params: { protocol: 'Aave', thresholdPct: 10 },
          },
          {
            id: 'task_02',
            name: 'check_depeg',
            dependencies: [],
            params: { token: 'USDC', pegLimit: 0.985 },
          },
          {
            id: 'task_03',
            name: 'withdraw',
            dependencies: ['task_01', 'task_02'],
            params: { asset: 'USDC', sourceChain: 'Base' },
          },
          {
            id: 'task_03_exit_guard',
            name: 'check_exit_liquidity',
            dependencies: ['task_03'],
            params: { asset: 'USDC', amount: 5000, targetChain: 'xlayer' },
          },
          {
            id: 'task_04',
            name: 'bridge',
            dependencies: ['task_03_exit_guard'],
            params: { asset: 'USDC', amount: 5000, sourceChain: 'Base', targetChain: 'xlayer' },
          },
        ],
      } as unknown as T;
    }
    
    if (lowerPrompt.includes('monday') || lowerPrompt.includes('gas_threshold') || lowerPrompt.includes('gas')) {
      return {
        tasks: [
          {
            id: 'task_01',
            name: 'check_gas',
            dependencies: [],
            params: { gasLimitGwei: 20, chain: 'ethereum' },
          },
          {
            id: 'task_02',
            name: 'check_balances',
            dependencies: ['task_01'],
            params: { asset: 'USDC', sourceChain: 'Base' },
          },
          {
            id: 'task_03_exit_guard',
            name: 'check_exit_liquidity',
            dependencies: ['task_02'],
            params: { asset: 'USDC', amount: 1000, targetChain: 'Base' },
          },
          {
            id: 'task_03',
            name: 'swap',
            dependencies: ['task_03_exit_guard'],
            params: { asset: 'ETH', sourceChain: 'Base' },
          },
          {
            id: 'task_04',
            name: 'bridge',
            dependencies: ['task_03'],
            params: { asset: 'ETH', amount: 500, sourceChain: 'Base', targetChain: 'xlayer' },
          },
          {
            id: 'task_05',
            name: 'swap',
            dependencies: ['task_04'],
            params: { asset: 'OKB', sourceChain: 'xlayer' },
          },
        ],
      } as unknown as T;
    }

    return {
      tasks: [
        {
          id: 'task_01',
          name: 'check_balances',
          dependencies: [],
          params: { asset: 'USDC', sourceChain: 'Ethereum' },
        },
        {
          id: 'task_02',
          name: 'bridge',
          dependencies: ['task_01'],
          params: { asset: 'USDC', amount: 5000, sourceChain: 'Ethereum', targetChain: 'Base' },
        },
        {
          id: 'task_02_exit_guard',
          name: 'check_exit_liquidity',
          dependencies: ['task_02'],
          params: { asset: 'USDC', amount: 5000, targetChain: 'Base' },
        },
        {
          id: 'task_03',
          name: 'deposit',
          dependencies: ['task_02_exit_guard'],
          params: { asset: 'USDC', amount: 5000, targetChain: 'Base', targetApy: 0.08 },
        },
      ],
    } as unknown as T;
  }

  // 3. Explainability mock response
  if (prompt.includes('Provide the structured explanation')) {
    const containsRefundLog = prompt.includes('escrow_refunded');
    if (containsRefundLog) {
      return {
        title: 'Yield Optimization Completed via Rerouting',
        summary: 'We initiated yield optimization for 5000 USDC. The first attempt to bridge via Compound Yield Agent failed verification due to high slippage. The escrow was refunded on-chain, Compound\'s reputation slashed, and the task automatically rerouted to Aave Yield Optimizer Agent which completed successfully.',
        stepsDescription: [
          'Checked USDC balances on Ethereum successfully.',
          'Attempted yield allocation via Compound Agent (failed and refunded).',
          'Successfully rerouted and deposited 5000 USDC into Aave at 8.2% APY.'
        ]
      } as unknown as T;
    }
    
    return {
      title: 'Yield Optimization Completed Successfully',
      summary: 'Your 5000 USDC has been successfully optimized for yield. We verified your balance, bridged the funds from Ethereum to Base using the Stargate Bridge Agent, and deposited them into Aave at 8.2% APY.',
      stepsDescription: [
        'Checked USDC balances on Ethereum successfully.',
        'Bridged 5000 USDC to Base via Stargate.',
        'Deposited 5000 USDC into Aave yield pool.'
      ]
    } as unknown as T;
  }

  throw new Error(`No mock response configured for prompt type: ${prompt.slice(0, 100)}`);
}

export async function generateStructured<T>({
  prompt,
  systemInstruction,
  schema,
}: GenerateConfig<T>): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY || 'mock-api-key-for-now';
  
  // Mock AI Gateway fallback for demo/offline runs
  if (apiKey === 'mock-api-key-for-now') {
    console.log('⚠️ AI Gateway: GEMINI_API_KEY is not configured. Falling back to structured mock response.');
    return getMockResponse<T>(prompt);
  }

  // Real Gemini LLM call path with graceful mock fallback on failure
  try {
    const config: any = {
      temperature: 0.1,
    };

    if (schema) {
      config.responseMimeType = 'application/json';
    }

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config,
    });

    const text = response.text;
    if (!text) {
      throw new Error('Received empty response from Gemini model');
    }

    if (schema) {
      const parsed = JSON.parse(text);
      const validated = schema.parse(parsed);
      return validated;
    }

    return text as unknown as T;
  } catch (error: any) {
    console.warn('⚠️ AI Gateway: Gemini API call failed. Falling back to structured mock response. Reason:', error?.message || error);
    try {
      return getMockResponse<T>(prompt);
    } catch (fallbackError) {
      // If mock fails or isn't matching, bubble up original error
      throw error;
    }
  }
}
