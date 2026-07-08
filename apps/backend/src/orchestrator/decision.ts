import { type Bid } from '@helix/database';

export interface DecisionPolicy {
  minProtocolRiskScore?: number;
  minTvlUsd?: number;
  maxSlippagePct?: number;
  maxGasPerTxUsd?: number;
  preferenceOrder?: string[];
}

export interface BidEvaluation {
  bidId: string;
  agentId: string;
  score: number;
  breakdown: {
    reputation: number;
    protocolRisk: number;
    liquidity: number;
    slippage: number;
    cost: number;
  };
  rejected: boolean;
  reason?: string;
}

export interface DecisionResult {
  selectedAgentId: string | null;
  evaluations: BidEvaluation[];
  reasoning: string;
}

export function evaluateBids(
  bidsList: Array<any>,
  policy: DecisionPolicy
): DecisionResult {
  const minRiskScore = policy.minProtocolRiskScore || 75;
  const minTvl = policy.minTvlUsd || 50000000;
  const maxSlippage = policy.maxSlippagePct || 0.5;

  const weights = {
    reputation: 0.40,
    protocolRisk: 0.25,
    liquidity: 0.15,
    slippage: 0.10,
    cost: 0.10,
  };

  const evaluations: BidEvaluation[] = bidsList.map((bid) => {
    // 1. Gated policy checks
    if (bid.protocolRiskScore < minRiskScore) {
      return {
        bidId: bid.id || '',
        agentId: bid.agentId,
        score: 0,
        breakdown: { reputation: 0, protocolRisk: 0, liquidity: 0, slippage: 0, cost: 0 },
        rejected: true,
        reason: `Protocol risk score ${bid.protocolRiskScore} is below your safety threshold of ${minRiskScore}`,
      };
    }

    if (parseFloat(bid.slippageEstimatedPct.toString()) > maxSlippage) {
      return {
        bidId: bid.id || '',
        agentId: bid.agentId,
        score: 0,
        breakdown: { reputation: 0, protocolRisk: 0, liquidity: 0, slippage: 0, cost: 0 },
        rejected: true,
        reason: `Estimated slippage ${bid.slippageEstimatedPct}% exceeds max limit of ${maxSlippage}%`,
      };
    }

    // 2. Score calculations (normalized to 0-1)
    const reputationScore = parseFloat(bid.reputationScore.toString()) / 100;
    const riskScore = bid.protocolRiskScore / 100;
    
    // Simulate liquidity score (higher available liquidity above task volume is better)
    const liquidityScore = 1.0; 

    // Slippage (lower is better, invert)
    const slippageScore = Math.max(0, 1.0 - (parseFloat(bid.slippageEstimatedPct.toString()) / maxSlippage));

    // Cost (lower is better, invert based on absolute threshold $5.00)
    const maxAllowedCost = policy.maxGasPerTxUsd || 5;
    const costScore = Math.max(0, 1.0 - (parseFloat(bid.feeUsd.toString()) / maxAllowedCost));

    const totalScore =
      reputationScore * weights.reputation +
      riskScore * weights.protocolRisk +
      liquidityScore * weights.liquidity +
      slippageScore * weights.slippage +
      costScore * weights.cost;

    return {
      bidId: bid.id || '',
      agentId: bid.agentId,
      score: Math.round(totalScore * 10000) / 100, // percentage score (e.g. 92.45)
      breakdown: {
        reputation: Math.round(reputationScore * weights.reputation * 100),
        protocolRisk: Math.round(riskScore * weights.protocolRisk * 100),
        liquidity: Math.round(liquidityScore * weights.liquidity * 100),
        slippage: Math.round(slippageScore * weights.slippage * 100),
        cost: Math.round(costScore * weights.cost * 100),
      },
      rejected: false,
    };
  });

  const validBids = evaluations.filter((e) => !e.rejected);
  
  if (validBids.length === 0) {
    return {
      selectedAgentId: null,
      evaluations,
      reasoning: 'All agent bids were rejected because they violated safety or slippage policies.',
    };
  }

  // Sort descending by score
  validBids.sort((a, b) => b.score - a.score);
  const winner = validBids[0];

  const selectedAgentId = winner.agentId;
  const reasoning = `Selected ${selectedAgentId} (Safety score: ${winner.score}/100) because it meets all risk policies and offers optimal risk-adjusted cost.`;

  return {
    selectedAgentId,
    evaluations,
    reasoning,
  };
}
