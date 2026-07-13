import { type TaskNode } from '@helix/ai';

export interface SpecialistBid {
  agentId: string;
  feeUsd: number;
  etaSeconds: number;
  confidence: number;
  protocolRiskScore: number;
  slippageEstimatedPct: number;
  reputationScore: number;
}

export function getAgentBids(task: TaskNode): SpecialistBid[] {
  const taskName = task.name;

  if (taskName === 'bridge') {
    return [
      {
        agentId: 'stargate-bridge-agent',
        feeUsd: 1.15,
        etaSeconds: 42,
        confidence: 0.960,
        protocolRiskScore: 88, // high TVL, audited
        slippageEstimatedPct: 0.23,
        reputationScore: 92.00,
      },
      {
        agentId: 'celer-bridge-agent',
        feeUsd: 1.05,
        etaSeconds: 35,
        confidence: 0.940,
        protocolRiskScore: 81,
        slippageEstimatedPct: 0.31,
        reputationScore: 81.00,
      },
      {
        agentId: 'curve-bridge-agent',
        feeUsd: 0.89,
        etaSeconds: 60,
        confidence: 0.920,
        protocolRiskScore: 71, // fails policy if min risk is 75
        slippageEstimatedPct: 0.41,
        reputationScore: 78.00,
      },
    ];
  }

  if (taskName === 'deposit') {
    return [
      {
        agentId: 'aave-yield-agent',
        feeUsd: 0.45,
        etaSeconds: 15,
        confidence: 0.990,
        protocolRiskScore: 95,
        slippageEstimatedPct: 0.05,
        reputationScore: 95.00,
      },
      {
        agentId: 'compound-yield-agent',
        feeUsd: 0.35,
        etaSeconds: 18,
        confidence: 0.970,
        protocolRiskScore: 88,
        slippageEstimatedPct: 0.08,
        reputationScore: 88.00,
      },
    ];
  }

  if (taskName === 'withdraw') {
    return [
      {
        agentId: 'aave-yield-agent',
        feeUsd: 0.30,
        etaSeconds: 12,
        confidence: 0.990,
        protocolRiskScore: 95,
        slippageEstimatedPct: 0.05,
        reputationScore: 95.00,
      },
      {
        agentId: 'compound-yield-agent',
        feeUsd: 0.25,
        etaSeconds: 15,
        confidence: 0.970,
        protocolRiskScore: 88,
        slippageEstimatedPct: 0.08,
        reputationScore: 88.00,
      },
    ];
  }

  if (taskName === 'swap') {
    return [
      {
        agentId: 'aave-yield-agent',
        feeUsd: 0.40,
        etaSeconds: 10,
        confidence: 0.980,
        protocolRiskScore: 95,
        slippageEstimatedPct: 0.10,
        reputationScore: 95.00,
      },
      {
        agentId: 'compound-yield-agent',
        feeUsd: 0.35,
        etaSeconds: 12,
        confidence: 0.970,
        protocolRiskScore: 88,
        slippageEstimatedPct: 0.12,
        reputationScore: 88.00,
      },
    ];
  }

  if (taskName === 'check_gas' || taskName === 'check_tvl' || taskName === 'check_depeg' || taskName === 'check_exit_liquidity') {
    return [
      {
        agentId: 'helix-oracle-agent',
        feeUsd: 0.00,
        etaSeconds: 1,
        confidence: 1.000,
        protocolRiskScore: 100,
        slippageEstimatedPct: 0.00,
        reputationScore: 100.00,
      }
    ];
  }

  // Fallback default bidding for generic tasks (e.g. check_balances)
  return [
    {
      agentId: 'stargate-bridge-agent',
      feeUsd: 0.05,
      etaSeconds: 2,
      confidence: 0.999,
      protocolRiskScore: 99,
      slippageEstimatedPct: 0.00,
      reputationScore: 92.00,
    },
  ];
}
