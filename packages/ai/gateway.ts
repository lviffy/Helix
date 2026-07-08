import { ai, GEMINI_MODEL } from './client';
import { type ZodType } from 'zod';

export interface GenerateConfig<T> {
  prompt: string;
  systemInstruction?: string;
  schema?: ZodType<T>;
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
    
    // 1. Parsing mock response
    if (prompt.includes('Parse the following')) {
      const isFailedPrompt = prompt.toLowerCase().includes('fail');
      return {
        type: 'yield_optimization',
        goal: {
          description: isFailedPrompt ? 'Yield Optimization (Failure Injection Demo)' : 'Maximize stablecoin yield',
          assets: [{ symbol: 'USDC', amount: 5000 }],
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
            id: 'task_03',
            name: 'deposit',
            dependencies: ['task_02'],
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
  }

  // Real Gemini LLM call path
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
  } catch (error) {
    console.error('🔴 Error in Gemini API Generation Gateway:', error);
    throw error;
  }
}
