import { Hono } from 'hono';
import { oracleService } from '../lib/oracleService';
import { processUserIntent } from '../orchestrator/core';

export const mcpRouter = new Hono();

// Helix Payout Wallet (Anvil account #0 for demo)
const PAY_TO_WALLET = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// x402 Payment Checker Helper
function checkX402Payment(c: any, costUsdt0: number): { isValid: boolean; txHash?: string; response?: any } {
  const txHash = c.req.header('x-402-payment-tx');

  if (!txHash) {
    console.log(`❌ x402: Payment Required. Missing transaction header.`);
    c.status(402);
    return {
      isValid: false,
      response: c.json({
        error: 'Payment Required',
        message: `This tool call is x402-gated. Please settle pay-per-call fee of ${costUsdt0} USDT0.`,
        paymentRequest: {
          payToAddress: PAY_TO_WALLET,
          amount: costUsdt0.toFixed(2),
          token: 'USDT0',
          chain: 'eip155:196', // X Layer Mainnet
        }
      })
    };
  }

  // Verify transaction receipt (mock verifier for local test, accepts any valid 0x hex)
  const isValidTx = /^0x[a-fA-F0-9]{64}$/.test(txHash);
  if (!isValidTx) {
    c.status(400);
    return {
      isValid: false,
      response: c.json({ error: 'Invalid Payment Proof', message: 'Transaction hash format is invalid.' })
    };
  }

  console.log(`✅ x402: Payment verified! Tx Hash: ${txHash}. Settled ${costUsdt0} USDT0.`);
  return { isValid: true, txHash };
}

// 1. List available MCP tools
mcpRouter.get('/tools', (c) => {
  return c.json({
    tools: [
      {
        name: 'get_telemetry_status',
        description: 'Retrieve real-time DeFi protocol TVL, stablecoin peg rates, and Ethereum gas prices.',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        pricing: { cost: 0.00, token: 'USDT0' }
      },
      {
        name: 'check_exit_liquidity',
        description: 'ExitGuard pre-trade check. Run this before sizing a swap/deposit to evaluate slippage and pool depth.',
        inputSchema: {
          type: 'object',
          properties: {
            protocolId: { type: 'string', description: 'Protocol ID to check, e.g., aave, compound' },
            amountUsd: { type: 'number', description: 'Size of the swap or deposit in USD' }
          },
          required: ['protocolId', 'amountUsd']
        },
        pricing: { cost: 0.05, token: 'USDT0' }
      },
      {
        name: 'submit_financial_intent',
        description: 'Submit a natural language financial intent to Helix for dry-run parsing and blueprint DAG generation.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Natural language goal (e.g. Optimize USDC yield on Aave)' },
            walletAddress: { type: 'string', description: 'User wallet address' }
          },
          required: ['prompt', 'walletAddress']
        },
        pricing: { cost: 0.10, token: 'USDT0' }
      }
    ]
  });
});

// 2. Call tool execution handler
mcpRouter.post('/tools/call', async (c) => {
  try {
    const body = await c.req.json();
    const { name, arguments: args } = body;

    if (!name) {
      c.status(400);
      return c.json({ error: 'Missing tool name' });
    }

    if (name === 'get_telemetry_status') {
      const data = oracleService.getTelemetry();
      return c.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }
        ]
      });
    }

    if (name === 'check_exit_liquidity') {
      // Gated by 0.05 USDT0
      const payment = checkX402Payment(c, 0.05);
      if (!payment.isValid) {
        return payment.response;
      }

      const { protocolId, amountUsd } = args;
      if (!protocolId || !amountUsd) {
        c.status(400);
        return c.json({ error: 'protocolId and amountUsd arguments are required.' });
      }

      const { slippagePct, exitDepthUsd } = oracleService.getExitSlippage(protocolId, amountUsd);
      const limitPct = 1.0; // default exit guard slippage limit
      const status = slippagePct > limitPct ? 'BLOCK' : slippagePct > 0.5 ? 'WARN' : 'OK';

      return c.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status,
              estimatedSlippagePct: slippagePct,
              limitSlippagePct: limitPct,
              poolExitDepthUsd: exitDepthUsd,
              tradeSizeUsd: amountUsd,
              verdict: status === 'BLOCK' 
                ? `BLOCK: Trade size ($${amountUsd}) is too large for the pool depth ($${exitDepthUsd}). Slippage exceeds ${limitPct}%.`
                : status === 'WARN'
                ? `WARN: Slippage is elevated (${slippagePct}%), but acceptable.`
                : `OK: Pool liquidity depth is healthy. Estimated slippage: ${slippagePct}%.`,
              x402Receipt: payment.txHash
            }, null, 2)
          }
        ]
      });
    }

    if (name === 'submit_financial_intent') {
      // Gated by 0.10 USDT0
      const payment = checkX402Payment(c, 0.10);
      if (!payment.isValid) {
        return payment.response;
      }

      const { prompt, walletAddress } = args;
      if (!prompt || !walletAddress) {
        c.status(400);
        return c.json({ error: 'prompt and walletAddress arguments are required.' });
      }

      // Run as dryRun: true to generate the blueprint preview
      const blueprint = await processUserIntent(walletAddress, prompt, true);
      
      return c.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Dry-run blueprint generated successfully. Please authorize this plan.',
              blueprint,
              x402Receipt: payment.txHash
            }, null, 2)
          }
        ]
      });
    }

    c.status(404);
    return c.json({ error: `Tool not found: ${name}` });
  } catch (error: any) {
    console.error('🔴 MCP execution error:', error);
    c.status(500);
    return c.json({ error: error.message });
  }
});
