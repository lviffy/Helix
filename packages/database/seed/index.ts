import { db } from '../client';
import { agents, users } from '../schema';

async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Seed dev user
  const devWallet = '0xAbC1234567890123456789012345678901234567';
  await db.insert(users).values({
    walletAddress: devWallet,
    policyProfile: {
      minProtocolRiskScore: 75,
      minTvlUsd: 50000000,
      maxGasPerTxUsd: 5,
      approvalThresholdUsd: 1000,
      avoidProtocols: ['unaudited_new_protocol'],
    },
  }).onConflictDoUpdate({
    target: users.walletAddress,
    set: {
      policyProfile: {
        minProtocolRiskScore: 75,
        minTvlUsd: 50000000,
        maxGasPerTxUsd: 5,
        approvalThresholdUsd: 1000,
        avoidProtocols: ['unaudited_new_protocol'],
      },
    },
  });
  console.log('👤 Dev user seeded:', devWallet);

  // 2. Seed Mock Agents
  const mockAgents = [
    {
      id: 'stargate-bridge-agent',
      walletAddress: '0xDef0000000000000000000000000000000000001',
      name: 'Stargate Bridge Agent',
      capabilities: ['bridge'],
      endpoint: 'http://localhost:4000/agents/stargate-bridge',
      reputationScore: '92.00',
      successRatePct: '98.70',
      totalVolumeUsd: '45000000.00',
      active: true,
    },
    {
      id: 'curve-bridge-agent',
      walletAddress: '0xDef0000000000000000000000000000000000002',
      name: 'Curve Bridge Agent',
      capabilities: ['bridge'],
      endpoint: 'http://localhost:4000/agents/curve-bridge',
      reputationScore: '78.00',
      successRatePct: '92.10',
      totalVolumeUsd: '15000000.00',
      active: true,
    },
    {
      id: 'celer-bridge-agent',
      walletAddress: '0xDef0000000000000000000000000000000000003',
      name: 'Celer Bridge Agent',
      capabilities: ['bridge'],
      endpoint: 'http://localhost:4000/agents/celer-bridge',
      reputationScore: '81.00',
      successRatePct: '95.00',
      totalVolumeUsd: '22000000.00',
      active: true,
    },
    {
      id: 'aave-yield-agent',
      walletAddress: '0xDef0000000000000000000000000000000000004',
      name: 'Aave Yield Optimizer Agent',
      capabilities: ['yield'],
      endpoint: 'http://localhost:4000/agents/aave-yield',
      reputationScore: '95.00',
      successRatePct: '99.90',
      totalVolumeUsd: '88000000.00',
      active: true,
    },
    {
      id: 'compound-yield-agent',
      walletAddress: '0xDef0000000000000000000000000000000000005',
      name: 'Compound Yield Optimizer Agent',
      capabilities: ['yield'],
      endpoint: 'http://localhost:4000/agents/compound-yield',
      reputationScore: '88.00',
      successRatePct: '97.40',
      totalVolumeUsd: '34000000.00',
      active: true,
    },
  ];

  for (const agent of mockAgents) {
    await db.insert(agents).values(agent).onConflictDoUpdate({
      target: agents.id,
      set: {
        walletAddress: agent.walletAddress,
        name: agent.name,
        capabilities: agent.capabilities,
        endpoint: agent.endpoint,
        reputationScore: agent.reputationScore,
        successRatePct: agent.successRatePct,
        totalVolumeUsd: agent.totalVolumeUsd,
        active: agent.active,
        updatedAt: new Date(),
      },
    });
    console.log(`🤖 Agent seeded/updated: ${agent.name} (${agent.id})`);
  }

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
