import { createWalletClient, createPublicClient, http, keccak256, toBytes, parseEther, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── X Layer Testnet chain definition ────────────────────────────────────────
// Chain ID: 195 | Explorer: https://www.oklink.com/xlayer-test
const xlayerTestnet = defineChain({
  id: 195,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.XLAYER_TESTNET_RPC || 'https://testrpc.xlayer.tech'],
    },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer-test' },
  },
  testnet: true,
});

// ─── Wallet setup ─────────────────────────────────────────────────────────────
// Set DEPLOYER_PRIVATE_KEY in your .env (the wallet that deployed the contracts)
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}` | undefined;
const SIMULATION_MODE = !PRIVATE_KEY;

if (SIMULATION_MODE) {
  console.warn('⚠️  DEPLOYER_PRIVATE_KEY not set — blockchain calls will return simulated tx hashes.');
  console.warn('   Set it in apps/backend/.env to use X Layer Testnet for real.');
}

const account = PRIVATE_KEY ? privateKeyToAccount(PRIVATE_KEY) : undefined;

const walletClient = account
  ? createWalletClient({
      account,
      chain: xlayerTestnet,
      transport: http(process.env.XLAYER_TESTNET_RPC || 'https://testrpc.xlayer.tech'),
    })
  : null;

const publicClient = createPublicClient({
  chain: xlayerTestnet,
  transport: http(process.env.XLAYER_TESTNET_RPC || 'https://testrpc.xlayer.tech'),
});

/** Returns a fake but formatted tx hash for simulation mode */
function simulatedHash(): `0x${string}` {
  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` as `0x${string}`;
}

// Load contract addresses
const ADDRESSES_PATH = join(__dirname, './addresses.json');
const addresses = JSON.parse(readFileSync(ADDRESSES_PATH, 'utf8'));

// Load ABIs
const OUT_DIR = join(__dirname, '../../../../packages/contracts/out');
const reputationAbi = JSON.parse(readFileSync(join(OUT_DIR, 'Reputation.abi'), 'utf8'));
const escrowAbi = JSON.parse(readFileSync(join(OUT_DIR, 'Escrow.abi'), 'utf8'));
const settlementAbi = JSON.parse(readFileSync(join(OUT_DIR, 'Settlement.abi'), 'utf8'));
const registryAbi = JSON.parse(readFileSync(join(OUT_DIR, 'AgentRegistry.abi'), 'utf8'));
const intentStorageAbi = JSON.parse(readFileSync(join(OUT_DIR, 'IntentStorage.abi'), 'utf8'));

export function getTaskIdHash(taskId: string): `0x${string}` {
  // If the taskId is already a valid UUID/hash, we can hash its bytes to get a clean bytes32
  return keccak256(toBytes(taskId));
}

/**
 * Retrieve the on-chain reputation score for a given agent.
 * Score is normalized from 0-10000 basis points down to a 0-100 scale.
 */
export async function getOnChainReputation(agentId: string): Promise<number> {
  if (SIMULATION_MODE) return 90.0; // default when no key
  try {
    const data = await publicClient.readContract({
      address: addresses.reputation,
      abi: reputationAbi,
      functionName: 'getReputation',
      args: [agentId],
    }) as [bigint, bigint, bigint, bigint];

    const scoreBp = Number(data[0]); // e.g. 9200
    return scoreBp / 100; // Returns 92.0
  } catch (error) {
    console.error(`⚠️ Error getting reputation for agent ${agentId}, returning default 90.0:`, error);
    return 90.0;
  }
}

/**
 * Create a new escrow lock on-chain for a task.
 * On X Layer Testnet: produces a real tx verifiable on oklink.com/xlayer-test
 */
export async function createOnChainEscrow(
  taskId: string,
  agentId: string,
  amountEth: string,
  timeoutSeconds: number = 3600
): Promise<`0x${string}`> {
  if (SIMULATION_MODE || !walletClient) {
    const hash = simulatedHash();
    console.log(`🔵 [SIM] Escrow lock simulated for task ${taskId}. Hash: ${hash}`);
    return hash;
  }

  const taskIdHash = getTaskIdHash(taskId);
  console.log(`⛓️ X Layer Testnet: Locking ${amountEth} OKB in Escrow for task ${taskId}...`);

  const hash = await walletClient.writeContract({
    address: addresses.escrow,
    abi: escrowAbi,
    functionName: 'createEscrow',
    args: [taskIdHash, agentId, BigInt(timeoutSeconds)],
    value: parseEther(amountEth),
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`⛓️ Escrow locked ✅  Tx: ${hash}`);
  console.log(`   🔗 https://www.oklink.com/xlayer-test/tx/${hash}`);
  return hash;
}

/**
 * Release the escrow lock — pays agent and updates on-chain reputation.
 */
export async function releaseOnChainEscrow(taskId: string): Promise<`0x${string}`> {
  if (SIMULATION_MODE || !walletClient) {
    const hash = simulatedHash();
    console.log(`🔵 [SIM] Escrow release simulated for task ${taskId}. Hash: ${hash}`);
    return hash;
  }

  const taskIdHash = getTaskIdHash(taskId);
  console.log(`⛓️ X Layer Testnet: Releasing Escrow for task ${taskId}...`);

  const hash = await walletClient.writeContract({
    address: addresses.escrow,
    abi: escrowAbi,
    functionName: 'releaseEscrow',
    args: [taskIdHash],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`⛓️ Escrow released ✅  Tx: ${hash}`);
  console.log(`   🔗 https://www.oklink.com/xlayer-test/tx/${hash}`);
  return hash;
}

/**
 * Refund the escrow — slashes agent reputation on-chain.
 */
export async function refundOnChainEscrow(taskId: string): Promise<`0x${string}`> {
  if (SIMULATION_MODE || !walletClient) {
    const hash = simulatedHash();
    console.log(`🔵 [SIM] Escrow refund simulated for task ${taskId}. Hash: ${hash}`);
    return hash;
  }

  const taskIdHash = getTaskIdHash(taskId);
  console.log(`⛓️ X Layer Testnet: Refunding Escrow for task ${taskId}...`);

  const hash = await walletClient.writeContract({
    address: addresses.escrow,
    abi: escrowAbi,
    functionName: 'refundEscrow',
    args: [taskIdHash],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`⛓️ Escrow refunded ✅  Tx: ${hash}`);
  console.log(`   🔗 https://www.oklink.com/xlayer-test/tx/${hash}`);
  return hash;
}

/**
 * Settle payment on X Layer — splits between agent wallet and treasury.
 */
export async function settleOnChainPayment(
  taskId: string,
  agentWallet: string,
  amountEth: string
): Promise<`0x${string}`> {
  if (SIMULATION_MODE || !walletClient) {
    const hash = simulatedHash();
    console.log(`🔵 [SIM] Payment settlement simulated for task ${taskId}. Hash: ${hash}`);
    return hash;
  }

  const taskIdHash = getTaskIdHash(taskId);
  console.log(`⛓️ X Layer Testnet: Settling payment for task ${taskId}. Agent: ${agentWallet}...`);

  const hash = await walletClient.writeContract({
    address: addresses.settlement,
    abi: settlementAbi,
    functionName: 'settlePayment',
    args: [taskIdHash, agentWallet as `0x${string}`],
    value: parseEther(amountEth),
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`⛓️ Payment settled ✅  Tx: ${hash}`);
  console.log(`   🔗 https://www.oklink.com/xlayer-test/tx/${hash}`);
  return hash;
}

/**
 * Register a specialist agent on-chain in the AgentRegistry contract.
 */
export async function registerOnChainAgent(
  agentId: string,
  agentWallet: string,
  endpoint: string
): Promise<`0x${string}`> {
  if (SIMULATION_MODE || !walletClient) {
    const hash = simulatedHash();
    console.log(`🔵 [SIM] Agent registration simulated for ${agentId}. Hash: ${hash}`);
    return hash;
  }

  console.log(`⛓️ X Layer Testnet: Registering agent ${agentId}...`);

  const hash = await walletClient.writeContract({
    address: addresses.agentRegistry,
    abi: registryAbi,
    functionName: 'registerAgent',
    args: [agentId, agentWallet as `0x${string}`, endpoint],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`⛓️ Agent registered ✅  Tx: ${hash}`);
  console.log(`   🔗 https://www.oklink.com/xlayer-test/tx/${hash}`);
  return hash;
}

/**
 * Record an active intent hash on-chain in the IntentStorage contract.
 */
export async function recordOnChainIntent(
  intentId: string,
  userWallet: string,
  intentHash: `0x${string}`,
  status: string
): Promise<`0x${string}`> {
  if (SIMULATION_MODE || !walletClient) {
    const hash = simulatedHash();
    console.log(`🔵 [SIM] Intent record simulated for ${intentId}. Hash: ${hash}`);
    return hash;
  }

  const intentIdHash = getTaskIdHash(intentId);
  console.log(`⛓️ X Layer Testnet: Recording intent ${intentId} in IntentStorage...`);

  const hash = await walletClient.writeContract({
    address: addresses.intentStorage,
    abi: intentStorageAbi,
    functionName: 'recordIntent',
    args: [intentIdHash, userWallet as `0x${string}`, intentHash, status],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`⛓️ Intent recorded ✅  Tx: ${hash}`);
  console.log(`   🔗 https://www.oklink.com/xlayer-test/tx/${hash}`);
  return hash;
}

