import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';
import { readFileSync, writeFileSync } from 'fs';
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

const OUT_DIR = join(__dirname, '../../../packages/contracts/out');

function loadArtifact(name: string) {
  const abi = JSON.parse(readFileSync(join(OUT_DIR, `${name}.abi`), 'utf8'));
  const bin = readFileSync(join(OUT_DIR, `${name}.bin`), 'utf8').trim() as `0x${string}`;
  const bytecode = bin.startsWith('0x') ? bin : `0x${bin}` as `0x${string}`;
  return { abi, bytecode };
}

async function main() {
  console.log('🏁 Deploying Helix smart contracts to local Anvil node...');
  
  // 1. Deploy Reputation
  const reputationArt = loadArtifact('Reputation');
  const reputationAddress = await walletClient.deployContract({
    abi: reputationArt.abi,
    bytecode: reputationArt.bytecode,
  });
  const repReceipt = await publicClient.waitForTransactionReceipt({ hash: reputationAddress });
  const repAddr = repReceipt.contractAddress!;
  console.log(`✅ Reputation deployed at: ${repAddr}`);

  // 2. Deploy AgentRegistry
  const registryArt = loadArtifact('AgentRegistry');
  const registryHash = await walletClient.deployContract({
    abi: registryArt.abi,
    bytecode: registryArt.bytecode,
  });
  const regReceipt = await publicClient.waitForTransactionReceipt({ hash: registryHash });
  const regAddr = regReceipt.contractAddress!;
  console.log(`✅ AgentRegistry deployed at: ${regAddr}`);

  // 3. Deploy Treasury
  const treasuryArt = loadArtifact('Treasury');
  const treasuryHash = await walletClient.deployContract({
    abi: treasuryArt.abi,
    bytecode: treasuryArt.bytecode,
  });
  const treasuryReceipt = await publicClient.waitForTransactionReceipt({ hash: treasuryHash });
  const treasuryAddr = treasuryReceipt.contractAddress!;
  console.log(`✅ Treasury deployed at: ${treasuryAddr}`);

  // 4. Deploy IntentStorage
  const storageArt = loadArtifact('IntentStorage');
  const storageHash = await walletClient.deployContract({
    abi: storageArt.abi,
    bytecode: storageArt.bytecode,
  });
  const storageReceipt = await publicClient.waitForTransactionReceipt({ hash: storageHash });
  const storageAddr = storageReceipt.contractAddress!;
  console.log(`✅ IntentStorage deployed at: ${storageAddr}`);

  // 5. Deploy Escrow (passing Reputation address)
  const escrowArt = loadArtifact('Escrow');
  const escrowHash = await walletClient.deployContract({
    abi: escrowArt.abi,
    bytecode: escrowArt.bytecode,
    args: [repAddr],
  });
  const escrowReceipt = await publicClient.waitForTransactionReceipt({ hash: escrowHash });
  const escrowAddr = escrowReceipt.contractAddress!;
  console.log(`✅ Escrow deployed at: ${escrowAddr}`);

  // 6. Deploy Settlement (passing Treasury address as fee recipient and fee bps - 0.5% / 50 bps)
  const settlementArt = loadArtifact('Settlement');
  const settlementHash = await walletClient.deployContract({
    abi: settlementArt.abi,
    bytecode: settlementArt.bytecode,
    args: [treasuryAddr, 50n],
  });
  const setReceipt = await publicClient.waitForTransactionReceipt({ hash: settlementHash });
  const setAddr = setReceipt.contractAddress!;
  console.log(`✅ Settlement deployed at: ${setAddr}`);

  // 7. Configure Reputation contract to trust Escrow contract as updater
  console.log('⚙️ Configuring Reputation updater permissions...');
  const setUpdaterHash = await walletClient.writeContract({
    address: repAddr,
    abi: reputationArt.abi,
    functionName: 'setUpdater',
    args: [escrowAddr],
  });
  await publicClient.waitForTransactionReceipt({ hash: setUpdaterHash });
  console.log('✅ Reputation contract updater successfully set to Escrow contract!');

  // Save addresses to JSON config
  const addresses = {
    reputation: repAddr,
    agentRegistry: regAddr,
    escrow: escrowAddr,
    settlement: setAddr,
    treasury: treasuryAddr,
    intentStorage: storageAddr,
  };
  
  const addressesPath = join(__dirname, '../src/blockchain/addresses.json');
  const fs = require('fs');
  const dir = join(__dirname, '../src/blockchain');
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }
  writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`📁 Addresses saved to: ${addressesPath}`);
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
