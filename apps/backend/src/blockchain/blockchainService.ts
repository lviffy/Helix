import { createWalletClient, createPublicClient, http, keccak256, toBytes, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';
import { readFileSync } from 'fs';
import { join } from 'path';

// Prefunded Anvil Account #0
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  chain: localhost,
  transport: http(),
});

const publicClient = createPublicClient({
  chain: localhost,
  transport: http(),
});

// Load contract addresses
const ADDRESSES_PATH = join(__dirname, './addresses.json');
const addresses = JSON.parse(readFileSync(ADDRESSES_PATH, 'utf8'));

// Load ABIs
const OUT_DIR = join(__dirname, '../../../../packages/contracts/out');
const reputationAbi = JSON.parse(readFileSync(join(OUT_DIR, 'Reputation.abi'), 'utf8'));
const escrowAbi = JSON.parse(readFileSync(join(OUT_DIR, 'Escrow.abi'), 'utf8'));

export function getTaskIdHash(taskId: string): `0x${string}` {
  // If the taskId is already a valid UUID/hash, we can hash its bytes to get a clean bytes32
  return keccak256(toBytes(taskId));
}

/**
 * Retrieve the on-chain reputation score for a given agent.
 * Score is normalized from 0-10000 basis points down to a 0-100 scale.
 */
export async function getOnChainReputation(agentId: string): Promise<number> {
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
 */
export async function createOnChainEscrow(
  taskId: string,
  agentId: string,
  amountEth: string,
  timeoutSeconds: number = 3600
): Promise<`0x${string}`> {
  const taskIdHash = getTaskIdHash(taskId);
  console.log(`⛓️ Blockchain: Locking ${amountEth} ETH in Escrow for task ${taskId}...`);
  
  const hash = await walletClient.writeContract({
    address: addresses.escrow,
    abi: escrowAbi,
    functionName: 'createEscrow',
    args: [taskIdHash, agentId, BigInt(timeoutSeconds)],
    value: parseEther(amountEth),
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`⛓️ Blockchain: Escrow lock completed. Tx: ${hash}`);
  return hash;
}

/**
 * Release the escrow lock to payout the agent and update reputation on-chain.
 */
export async function releaseOnChainEscrow(taskId: string): Promise<`0x${string}`> {
  const taskIdHash = getTaskIdHash(taskId);
  console.log(`⛓️ Blockchain: Releasing Escrow for task ${taskId}...`);

  const hash = await walletClient.writeContract({
    address: addresses.escrow,
    abi: escrowAbi,
    functionName: 'releaseEscrow',
    args: [taskIdHash],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`⛓️ Blockchain: Escrow payout completed. Tx: ${hash}`);
  return hash;
}

/**
 * Refund the escrow lock on-chain due to failure and decrement agent reputation.
 */
export async function refundOnChainEscrow(taskId: string): Promise<`0x${string}`> {
  const taskIdHash = getTaskIdHash(taskId);
  console.log(`⛓️ Blockchain: Refunding Escrow for task ${taskId}...`);

  const hash = await walletClient.writeContract({
    address: addresses.escrow,
    abi: escrowAbi,
    functionName: 'refundEscrow',
    args: [taskIdHash],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`⛓️ Blockchain: Escrow refund completed. Tx: ${hash}`);
  return hash;
}
