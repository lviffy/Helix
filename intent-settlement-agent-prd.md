# PRD: Intent Settlement Agent (ISA) v2.0
### "The Operating System for Agent-Coordinated Finance"

**Built for:** OKX.AI Genesis Hackathon (Submissions: Jul 3 – Jul 17, 2026, 23:59 UTC)
**Type:** Agent Service Provider (ASP) — Onchain agent coordination / orchestration layer + open agent marketplace
**Primary Tracks:** Best Product, Finance Copilot, Revenue Rocket, Infrastructure
**Status:** Draft v2.0 (Community Feedback Integrated)

---

## 1. One-Line Pitch

**A financial operating system that transforms agent-to-agent payment into economic coordination: orchestrate specialized agents, learn from every execution, and let users define policies instead of rewrites.**

---

## 2. Problem Statement

**The Current Fragmentation:**
- Users with multi-step financial goals (cross-chain yield, portfolio rebalancing, risk-adjusted transfers) either manually chain tools together or trust a single agent blindly.
- Each "AI crypto agent" is a silo — Bridge Agent, Yield Agent, Swap Agent — with no coordination, reputation tracking, or competitive selection.
- No continuous monitoring: every goal requires a new prompt or manual trigger.
- No explainability: when something goes wrong, users have no audit trail of *why* decisions were made.
- No learning: agents improve arbitrarily and randomly; the orchestration engine forgets everything after each execution.

**Why This Matters:**
OKX.AI's A2A/A2MCP primitives enable **trustless economic coordination between agents**. Most hackathon entries will treat this as a nice-to-have or leave it unused. ISA makes agent-to-agent negotiation the *core product* — not just API calling, but true marketplace dynamics: bidding, reputation, competitive selection, and automatic rerouting on failure.

The opportunity: **build the infrastructure layer that other agents will plug into**, not just a single application.

---

## 3. Vision: Three Shifts

### 3.1 From One-Shot to Continuous
Instead of:
> "Bridge 500 USDC to Base"

Users define:
> "Keep my idle stablecoins earning ≥8% APY. Rebalance monthly. Alert me before moving > $1K."

ISA monitors positions, detects APY changes, auto-rebalances, executes without new prompts. **Intent → continuous execution**.

### 3.2 From Reputation-Only to Multi-Factor Decision Making
Instead of:
> "Cheapest bid wins"

ISA considers:
- 40% Reputation (onchain history)
- 25% Protocol Risk (TVL, audits, exploit history)
- 15% Liquidity depth
- 10% Execution slippage
- 10% Gas cost

Decision is explainable: *"Agent A was 15% cheaper, but Agent B selected because its risk score 94 vs 61."*

### 3.3 From Fixed Agents to Open Marketplace
Instead of:
> "Use the Bridge Agent we built"

ISA becomes:
> "Uber for AI Agents"

Anyone registers a Bridge, Swap, Yield, Tax, Insurance, Compliance, or Wallet Recovery agent. Each earns reputation, fees, and leaderboard ranking. Ecosystem scales with ISA as foundation, not ISA as the only player.

---

## 4. Core Goals

1. **Demonstrate a real agent economy** — one orchestrator decomposing a goal, multiple specialists bidding competitively, verified execution with escrow, live reputation updates. Use genuine A2A escrow, not simulated calls.

2. **Build decision transparency** — every action logged with full reasoning: why was this agent chosen, why was that one rejected, what constraints gated the decision.

3. **Create continuous financial coordination** — shift from one-off automation ("execute this intent") to ongoing monitoring and autonomous rebalancing.

4. **Prove marketplace viability** — open agent registry with real reputation, fees, and leaderboard. Other developers can build specialist agents and earn.

5. **Make it infrastructure, not just an app** — publish the intent schema, negotiation protocol, and agent interface as reusable standards; offer an SDK for builders.

6. **Ship something that lives** — passes OKX.AI review and goes live on the marketplace with a working A2A/A2MCP entry point.

---

## 5. Non-Goals (v1)

- Full multi-chain support (v1: Ethereum + Base, 2 chains max).
- Arbitrary financial intents (v1: stablecoin yield optimization + rebalancing + safe cross-chain transfers).
- Third-party specialist agents at launch (v1: minimal self-built specialists for reliability; roadmap: integrate live ASPs).
- Non-crypto intents (explicitly roadmap item; out of scope for v1).

---

## 6. Target Users

| User | Need |
|---|---|
| **Retail crypto holder** | "Set and forget" cross-chain yield optimization with monthly rebalancing, price alerts, and explainable decisions. |
| **Crypto-native investor** | Policy-based portfolio management (e.g., "never bridge with TVL < $50M, always favor 8%+ yield, cap gas at $5"). |
| **Specialist agent builders** | Reputation-aware marketplace to register Bridge/Yield/Swap/Tax agents, earn fees, compete on metrics, and plug into ISA's orchestration. |
| **Other ASP builders** | Reusable intent schema, negotiation protocol, and agent interface to build competing orchestrators without starting from zero. |
| **OKX.AI platform** | Flagship demonstration of A2A economy in production, with visible trust, reputation, and revenue. |

---

## 7. Product Narrative / Core User Flow

### 7.1 Initial Setup
1. User connects wallet and optionally sets up a **policy profile**:
   - *"Never use bridges with TVL under $50M"*
   - *"Minimum yield target: 8% APY"*
   - *"Maximum gas per transaction: $5"*
   - *"Require manual approval for moves > $1,000"*

### 7.2 Intent Definition
2. User creates an intent (natural language or from a template):
   - **Template example:** *"Maximize Stablecoin Yield"* → ISA auto-fills constraints (low slippage, high liquidity, top audited protocols).
   - **Custom example:** *"Keep my $10K USDC earning the best yield across Ethereum and Base. Rebalance monthly. Avoid unaudited protocols."*

### 7.3 Parsing → Planning
3. **Intent Parser** (LLM) converts to structured JSON:
   ```json
   {
     "type": "yield_optimization",
     "assets": [{"symbol": "USDC", "amount": 10000}],
     "chains": ["ethereum", "base"],
     "yield_target_apy": 0.08,
     "rebalance_frequency": "monthly",
     "risk_policies": ["require_audit", "min_tvl_50m", "max_bridge_slippage_0.5"],
     "constraints": {"max_gas_usd": 5, "approval_threshold_usd": 1000},
     "confidence_target": 0.90
   }
   ```

4. **Planner** generates a DAG of tasks:
   ```
   check_balances_eth → check_yields_eth → 
   check_balances_base → check_yields_base →
   identify_best_route → bridge_if_needed → 
   deposit_staking → schedule_next_check
   ```

### 7.4 Agent Broadcast & Bidding
5. **Orchestrator** broadcasts each task to eligible specialist agents with a detailed RFQ:
   ```json
   {
     "task_id": "bridge_5000_usdc_eth_to_base_v2",
     "deadline_seconds": 8,
     "constraints": {
       "min_protocol_risk_score": 75,
       "max_tvl": 100000000,
       "min_liquidity": 1000000,
       "max_slippage_pct": 0.5
     },
     "previous_agent_reputation": "high"
   }
   ```

6. Specialist agents respond with bids:
   ```json
   {
     "agent_id": "stargate-bridge-agent",
     "task_id": "bridge_5000_usdc_eth_to_base_v2",
     "proposal": {
       "fee_usd": 1.15,
       "eta_seconds": 42,
       "confidence": 0.96,
       "protocol_risk_score": 88,
       "slippage_estimated_pct": 0.23,
       "liquidity_available": 2500000,
       "success_guarantee": "rollback_on_failure"
     },
     "agent_reputation_onchain": 92
   }
   ```

### 7.5 Intelligent Selection
7. **Multi-factor Decision Engine** evaluates each bid:
   ```
   Stargate Bridge Agent
   ├─ Reputation (onchain): 92/100 → 40% weight → 36.8 pts
   ├─ Protocol Risk: 88/100 → 25% weight → 22.0 pts
   ├─ Liquidity: ✓ (2.5M available) → 15% weight → 15.0 pts
   ├─ Slippage: 0.23% estimated → 10% weight → 9.7 pts
   ├─ Fee + Gas: $1.15 → 10% weight → 8.5 pts
   └─ Total Score: 92.0 / 100
   
   Curve Bridge Agent
   ├─ Reputation: 78/100 → 40% → 31.2 pts
   ├─ Protocol Risk: 75/100 → 25% → 18.75 pts
   ├─ Liquidity: ✓ (1.8M available) → 15% → 13.5 pts
   ├─ Slippage: 0.41% → 10% → 8.1 pts
   ├─ Fee + Gas: $0.89 → 10% → 8.0 pts
   └─ Total Score: 79.6 / 100
   
   → Stargate selected (17% higher safety despite 29% higher cost)
   ```

   Decision is logged with full reasoning.

### 7.6 Escrow → Execution → Verification
8. Orchestrator locks escrow with Stargate Bridge Agent. Agent executes. Submits proof (tx hash, balance confirmation).

9. **Execution Verification** confirms the outcome matched expectations. On success: escrow releases, ISA takes coordination fee, agent reputation increases slightly. On failure: escrow withheld, agent reputation decreases, task auto-reroutes to next-ranked bidder.

### 7.7 Continuous Monitoring (Async)
10. Intent is stored with its policy. ISA **continuously monitors** the user's positions:
    - Monthly rebalancing trigger fires → intent is re-executed (no new user prompt).
    - APY drops below 8% → ISA alerts and optionally auto-rebalances (depends on policy).
    - Major market event detected → ISA can pause execution (optional MCP integration).

### 7.8 Reporting & Dashboard
11. User sees:
    - **Portfolio Dashboard:** Assets, historical yield, revenue earned, fees paid, agent performance.
    - **Explainability Timeline:**
      ```
      10:02 Intent received: Maximize yield, monthly rebalance
      10:03 Planner generated 5 tasks
      10:04 Broadcast to 4 agents
      10:04 3 responses received (1 filtered by reputation)
      10:05 Stargate selected (safety score 92 vs 80)
      10:06 Escrow locked, $5,000 held
      10:09 Bridge confirmed (Eth → Base)
      10:10 Yield deposit confirmed (8.4% APY Aave)
      10:12 Fee accrued to ISA: $1.15
      ✓ Complete
      ```
    - **Audit Trail:** Link to full onchain log with every decision and reasoning.

---

## 8. Key Features

### 8.1 MVP (Must-Have — Required for Valid, Approvable Submission)

| # | Feature | Description | Technical Spec |
|---|---|---|---|
| **M1** | Intent Parser | NL → structured JSON | LLM-based + rule validation; supports intent templates |
| **M2** | Rule-Based Planner | Deterministic task DAG | Ordered tasks: balance check → yield discovery → bridge → deposit → monitor |
| **M3** | Orchestrator Core | Broadcasts tasks, collects bids, selects winners | Real A2A broadcast; 5–10 second bid window |
| **M4** | Multi-Round Bidding | 2–3 real specialist agents per task | Actual escrow-backed bids |
| **M5** | Multi-Factor Decision Engine | 40% reputation, 25% protocol risk, 15% liquidity, 10% slippage, 10% cost | Scoring model; decision logged with reasoning |
| **M6** | Reputation Gate | Hard-reject bids below reputation threshold | Onchain Oracle lookup; caching for speed |
| **M7** | A2A Escrow Lock/Release | Real, onchain escrow integration | Uses OKX.AI Onchain OS primitives; verified release only |
| **M8** | Execution Verification | Proof-of-completion before escrow release | Tx hash validation + balance change detection |
| **M9** | Audit Trail | Immutable, human-readable decision log | Onchain or anchored; links from user report |
| **M10** | Coordination Fee | ISA takes 0.2–0.5% per successful task | Visible in ISA wallet; real, live accrual |
| **M11** | Policy Engine | User-defined constraints (min TVL, max gas, yield target, approval thresholds) | Enforced in orchestrator; gates task execution |
| **M12** | Portfolio Dashboard | View assets, historical yield, fees paid, agent metrics | Reads ISA state; real-time updates |
| **M13** | Explainability Timeline | Visual, plain-English execution flow | Auto-generated from audit trail |
| **M14** | OKX.AI Listing | Passes review; live on Marketplace | A2MCP entry point; submitted early |

### 8.2 Should-Have (Differentiators — Build After MVP Stabilizes)

| # | Feature | Description | Tech Notes |
|---|---|---|---|
| **S1** | Intent Templates | Predefined intents (Maximize Yield, Weekly Rebalance, Safe Exit, etc.) | Drop-in constraints; reduces onboarding friction |
| **S2** | Continuous Monitoring + Auto-Rebalance | Monitor positions; execute recurring intents without new user prompts | Background task scheduler; event triggers |
| **S3** | Failure Recovery + Rerouting | Rollback, recover partial state, retry with next-ranked agent | Atomic transactions; graceful degradation |
| **S4** | Agent Learning System | After each execution, adjust agent ranking based on actual outcome (speed, success rate, etc.) | Persistent agent metrics; Bayesian updating |
| **S5** | AI Negotiation | Orchestrator dynamically negotiates with agents ("Can you reduce deadline to 30s for $0.95?") | LLM-driven; real negotiation, not static quotes |
| **S6** | Intent Graph Visualization | DAG of tasks rendered live as they execute | Real-time UI; helps with demos |
| **S7** | Agent Performance Leaderboard | Public ranking by success rate, cost, speed, trust | Incentivizes quality agents; transparency |
| **S8** | Multi-Agent Consensus | Three agents analyze/propose; orchestrator chooses best | Redundancy; improves decision confidence |
| **S9** | Prediction Layer | Before execution, simulate outcomes: expected APY, gas, success probability | Monte Carlo / historical simulation |
| **S10** | Agent Marketplace Registry | Open signup for specialist agents (Swap, Tax, Insurance agents, etc.) | Governance; reputation seeding; fee sharing |
| **S11** | Agent NFT/Identity Profiles | Each agent has onchain profile: capabilities, reputation, revenue, badges | ERC-721 or equivalent; portfolio branding |
| **S12** | MCP Plugin Integration | News, sentiment, calendar, email MCPs to gate execution | *"Don't rebalance during major market events"* |
| **S13** | SDK + Developer Docs | Open SDK for builders to create competing orchestrators | TypeScript/Python; uses published intent schema |
| **S14** | Revenue Sharing | Split fees among: Platform, Agent Reward, Reputation Reward, Insurance Pool | Richer agent economy; incentive alignment |

### 8.3 Could-Have (Nice-to-Have — Roadmap)

- Multi-chain support (3+ chains).
- Non-crypto intents (travel, subscriptions, etc.).
- Third-party insurance underwriting.
- Subscription/recurring payments for agents.

---

## 9. System Architecture

```
                    ┌──────────────────────────┐
                    │   User (NL Intent)       │
                    │   + Policy Profile       │
                    └────────────┬─────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │   Intent Parser (LLM)    │ ← Templates available
                    └────────────┬─────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │   Rule-Based Planner     │
                    │   (DAG Generator)        │
                    └────────────┬─────────────┘
                                 ▼
         ┌───────────────────────────────────────────────┐
         │   Orchestrator Agent (ISA Core)               │
         │   ├─ Intent Store (continuous tracking)      │
         │   ├─ Multi-Factor Decision Engine            │
         │   ├─ Reputation Oracle Client                │
         │   └─ Escrow Manager                          │
         └─┬─────────────────────────┬──────────────────┘
           │                         │
    Task Broadcast                   │ Query Reputation
           │                         ▼
           ├──────────────────────────────────────────────────┐
           │                                                  │
           ▼                         ┌─────────────────────────┘
    ┌──────────────────────┐        │
    │ Specialist Agents    │   ┌────▼───────────────┐
    │                      │   │ Reputation Oracle  │
    │ • Bridge Agents      │   │ (Onchain History)  │
    │ • Yield Agents       │   │                    │
    │ • Swap Agents        │   │ + Learning Engine  │
    │ • Future: Tax,       │   │   (feedback loop)  │
    │   Insurance, etc.    │   └────┬───────────────┘
    │                      │        │
    └────────┬─────────────┘        │
             │ (Bids)                │
             │ + Confidence          │
             │ + Risk Scores         │
             └────────┬──────────────┘
                      ▼
           ┌─────────────────────────┐
           │  A2A Escrow Lock        │
           │  (OKX.AI Onchain OS)    │
           └──────────┬──────────────┘
                      ▼
           ┌─────────────────────────┐
           │  Execution + Proof      │
           │  Verification           │
           └──────────┬──────────────┘
                      ▼
           ┌─────────────────────────┐
           │  Onchain Audit Log      │
           │  (Decision Trace)       │
           └──────────┬──────────────┘
                      ▼
           ┌─────────────────────────┐
           │  User Reports:          │
           │  • Dashboard            │
           │  • Timeline             │
           │  • Fee Accrual          │
           │  • Audit Trail Link     │
           └─────────────────────────┘

    Async Loop (For Continuous Intents)
    ─────────────────────────────────────
         Schedule Event Trigger
                  ▼
         Re-execute Intent
                  ▼
         Update Monitoring Status
                  ▼
         Loop back to Orchestrator
```

---

## 10. Technical Specifications

### 10.1 Intent Schema

```json
{
  "id": "intent_202607_8a4f9c",
  "type": "yield_optimization",
  "user_wallet": "0xAbC...",
  "created_at": "2026-07-08T10:00:00Z",
  
  "goal": {
    "description": "Maximize USDC yield across Eth and Base",
    "assets": [
      {
        "symbol": "USDC",
        "amount": 10000,
        "current_locations": ["ethereum"],
        "source_chain": "ethereum"
      }
    ],
    "target_chains": ["ethereum", "base"],
    "yield_target_apy": 0.08,
    "rebalance_frequency": "monthly",
    "confidence_threshold": 0.90
  },

  "policies": {
    "protocol_constraints": {
      "require_audit": true,
      "min_protocol_risk_score": 75,
      "min_tvl_usd": 50000000,
      "avoid_protocols": ["new_unaudited_protocol"]
    },
    "execution_constraints": {
      "max_slippage_pct": 0.5,
      "max_gas_per_tx_usd": 5,
      "approval_threshold_usd": 1000,
      "max_bridge_price_impact_pct": 0.25
    },
    "risk_preferences": {
      "preference_order": ["safety", "yield", "cost"],
      "max_concurrent_risk_score": 50,
      "pause_on_market_volatility": true
    }
  },

  "status": "active",
  "is_recurring": true,
  "next_execution": "2026-08-08T10:00:00Z",
  "execution_history": [
    {
      "execution_id": "exec_001",
      "timestamp": "2026-07-08T10:00:00Z",
      "status": "completed",
      "tasks_executed": ["check_balances", "bridge", "deposit"],
      "result_apy": 0.084,
      "fees_paid": 1.15,
      "audit_trail_hash": "0x123abc..."
    }
  ]
}
```

### 10.2 Bid Schema (Enhanced)

```json
{
  "agent_id": "stargate-bridge-agent",
  "agent_wallet": "0xDef...",
  "task_id": "task_bridge_5000_usdc_eth_base",
  "request_timestamp": "2026-07-08T10:03:00Z",
  "bid_timestamp": "2026-07-08T10:03:04Z",

  "quote": {
    "fee_usd": 1.15,
    "fee_pct": 0.023,
    "eta_seconds": 42,
    "confidence": 0.96,
    "success_guarantee": "full_rollback_on_failure"
  },

  "analysis": {
    "protocol_risk_score": 88,
    "liquidity_available_usd": 2500000,
    "slippage_estimated_pct": 0.23,
    "execution_path": "stargate_usdc_bridge",
    "alternative_paths": 2
  },

  "agent_metrics": {
    "reputation_onchain": 92,
    "success_rate_pct": 98.7,
    "avg_execution_time_seconds": 40,
    "total_volume_usd": 45000000,
    "disputes": 0,
    "slashing_events": 0
  }
}
```

### 10.3 Multi-Factor Decision Engine

```javascript
// Scoring Logic
const scoreAgent = (bid, policies) => {
  const weights = {
    reputation: 0.40,
    protocolRisk: 0.25,
    liquidity: 0.15,
    slippage: 0.10,
    cost: 0.10
  };

  const scores = {
    reputation: bid.agent_metrics.reputation_onchain / 100,
    protocolRisk: bid.analysis.protocol_risk_score / 100,
    liquidity: Math.min(
      1.0,
      bid.analysis.liquidity_available_usd / policies.min_liquidity_usd
    ),
    slippage: 1.0 - (bid.analysis.slippage_estimated_pct / 1.0), // Inverted (lower is better)
    cost: 1.0 - (bid.quote.fee_usd / policies.max_fee_usd)
  };

  // Gate: hard-reject if reputation below threshold
  if (scores.reputation < (policies.min_reputation_score / 100)) {
    return { score: 0, rejected: true, reason: "reputation_gate_failed" };
  }

  // Weighted sum
  const totalScore =
    scores.reputation * weights.reputation +
    scores.protocolRisk * weights.protocolRisk +
    scores.liquidity * weights.liquidity +
    scores.slippage * weights.slippage +
    scores.cost * weights.cost;

  return {
    score: totalScore,
    breakdown: scores,
    weights: weights,
    rejected: false
  };
};

// Example output
const decision = {
  selectedAgent: "stargate-bridge-agent",
  finalScore: 0.92,
  scoreBreakdown: {
    reputation: 0.92 * 0.40,      // 0.368
    protocolRisk: 0.88 * 0.25,    // 0.22
    liquidity: 1.0 * 0.15,         // 0.15
    slippage: 0.9977 * 0.10,       // 0.0998
    cost: 0.85 * 0.10              // 0.085
  },
  reasoning: "Selected for 17% higher safety vs Curve (risk 88 vs 75) despite 29% higher cost ($1.15 vs $0.89). Meets all policies.",
  alternatives: [
    { agent: "curve-bridge", score: 0.796, reason: "Lower cost but higher slippage risk" }
  ]
};
```

### 10.4 Reputation Oracle Integration

```json
{
  "agent_id": "stargate-bridge-agent",
  "reputation_model": {
    "onchain_metrics": {
      "successful_tasks": 987,
      "failed_tasks": 2,
      "disputed_tasks": 0,
      "success_rate_pct": 99.8,
      "total_volume_usd": 45000000,
      "avg_response_time_ms": 340
    },
    "trust_components": {
      "transaction_history_score": 95,  // Based on onchain Tx patterns
      "escrow_settlement_rate": 99.8,   // % of escrows settled without dispute
      "community_review_score": 88,     // Gated human reviews (if applicable)
      "age_of_agent_days": 180
    },
    "final_trust_score": 92,
    "last_updated": "2026-07-08T09:55:00Z",
    "next_update_trigger": "task_completion | manual_refresh"
  },
  
  "learning_feedback_loop": {
    "previous_execution": {
      "task_id": "task_bridge_3000_usdc",
      "outcome": "success",
      "actual_slippage_pct": 0.22,
      "actual_execution_seconds": 38,
      "reputation_delta": "+0.5"  // Slight increase for exceeding confidence
    }
  }
}
```

### 10.5 Audit Trail Structure

```json
{
  "intent_id": "intent_202607_8a4f9c",
  "execution_id": "exec_001",
  "timestamp_start": "2026-07-08T10:00:00Z",
  "timestamp_end": "2026-07-08T10:12:35Z",
  
  "audit_entries": [
    {
      "timestamp": "2026-07-08T10:00:00Z",
      "event": "intent_received",
      "details": {
        "user_wallet": "0xAbC...",
        "goal": "yield_optimization",
        "assets": "10000 USDC"
      }
    },
    {
      "timestamp": "2026-07-08T10:03:00Z",
      "event": "broadcast_to_agents",
      "details": {
        "task": "bridge_5000_usdc_eth_base",
        "agents_count": 4,
        "deadline_seconds": 8,
        "required_policies": ["min_tvl_50m", "max_slippage_0.5%"]
      }
    },
    {
      "timestamp": "2026-07-08T10:03:05Z",
      "event": "bids_received",
      "details": {
        "valid_bids": 3,
        "rejected_bids": 1,
        "rejection_reason": "reputation_score_78_below_threshold_80"
      }
    },
    {
      "timestamp": "2026-07-08T10:03:08Z",
      "event": "agent_selected",
      "details": {
        "selected_agent": "stargate-bridge-agent",
        "final_score": 0.92,
        "decision_reasoning": "40% reputation (92) + 25% protocol_risk (88) + 15% liquidity + 10% slippage + 10% cost = 0.92. Highest safety despite higher fee.",
        "alternatives_considered": [
          {
            "agent": "curve-bridge",
            "score": 0.796,
            "reason_not_selected": "Protocol risk 75 below safety preference"
          }
        ]
      }
    },
    {
      "timestamp": "2026-07-08T10:03:10Z",
      "event": "escrow_locked",
      "details": {
        "escrow_id": "escrow_0x123abc",
        "amount_usd": 5000,
        "agent_wallet": "0xDef...",
        "hold_time_seconds": 300
      }
    },
    {
      "timestamp": "2026-07-08T10:09:45Z",
      "event": "execution_completed",
      "details": {
        "agent_id": "stargate-bridge-agent",
        "tx_hash": "0x456def...",
        "status": "confirmed",
        "actual_fee": 1.13,
        "actual_execution_time_seconds": 41
      }
    },
    {
      "timestamp": "2026-07-08T10:10:00Z",
      "event": "verification_passed",
      "details": {
        "proof": "balance_increase_from_5000_to_5000_on_base",
        "verification_method": "onchain_balance_check"
      }
    },
    {
      "timestamp": "2026-07-08T10:10:05Z",
      "event": "escrow_released",
      "details": {
        "escrow_id": "escrow_0x123abc",
        "agent_reward": 4998.85,
        "isa_coordination_fee": 1.15,
        "status": "settled"
      }
    },
    {
      "timestamp": "2026-07-08T10:10:10Z",
      "event": "reputation_updated",
      "details": {
        "agent_id": "stargate-bridge-agent",
        "previous_score": 92.0,
        "new_score": 92.1,
        "delta_reason": "successful_execution_faster_than_promised"
      }
    },
    {
      "timestamp": "2026-07-08T10:10:15Z",
      "event": "next_execution_scheduled",
      "details": {
        "intent_id": "intent_202607_8a4f9c",
        "next_trigger": "2026-08-08T10:00:00Z",
        "trigger_type": "monthly_rebalance"
      }
    }
  ],

  "onchain_anchor": "0x789ghi...",
  "audit_trail_hash": "0xabc123...",
  "verification_signature": "0xdef456..."
}
```

---

## 11. Build Plan (Phased)

### Phase 1: Minimum Viable Orchestrator (Days 1–3)
**Goal:** Get a working end-to-end flow with real escrow, pass OKX.AI review early.

- [ ] Intent parser + basic planner (deterministic task DAG)
- [ ] One specialist agent (minimal but real) + orchestrator (no bidding yet)
- [ ] Real A2A escrow lock/release (M7)
- [ ] Basic execution verification (M8)
- [ ] Simple audit trail (M9)
- [ ] Submit for OKX.AI review (M14) ← **Critical path item**

**Demo:** Single-task orchestration end-to-end, showing intent → escrow → verified execution.

---

### Phase 2: Multi-Agent Marketplace + Decision Engine (Days 3–5)
**Goal:** Turn it into a real agent economy with intelligent selection.

- [ ] Add 2–3 more specialist agents (real or minimal mocked)
- [ ] Multi-round bidding (M4)
- [ ] Reputation Oracle lookup + gate (M5, M6)
- [ ] Multi-factor decision engine (M5) — implement scoring model
- [ ] Audit trail expanded to show decision reasoning
- [ ] Policy engine constraints (M11)
- [ ] Fee visible in wallet (M10)

**Demo:** Live bidding from 3 agents, rejection of low-reputation bidder, selection based on multi-factor score (not just price).

---

### Phase 3: Continuous Monitoring + Learning (Days 5–6)
**Goal:** Turn one-shot into operating system.

- [ ] Intent storage + recurring execution scheduling (S2)
- [ ] Reputation learning loop (S4)
- [ ] Failure recovery + rerouting (S3)
- [ ] Portfolio dashboard (M12)
- [ ] Explainability timeline (M13)

**Demo:** Show agent failing, being re-ranked down, task auto-rerouting to next best agent, all live.

---

### Phase 4: Polish + Packaging (Day 6–7)
**Goal:** Ship something that impresses and lives.

- [ ] Demo script rehearsal (3+ full dry runs)
- [ ] X post with #OKXAI walkthrough
- [ ] Final review checklist against OKX.AI requirements
- [ ] Publish open intent schema + agent interface (for ecosystem goodwill)

---

## 12. Live Demo Script (Target: 90–120 Seconds)

**Setup:** ISA dashboard visible; 3 specialist agents running; intent templates available.

```
0:00–0:12
User selects template: "Maximize Stablecoin Yield"
→ Shows structured intent JSON auto-populate
→ Sets policy: "min 8% APY, max $5 gas, never use unaudited"

0:12–0:25
User submits intent for $5,000 USDC
→ Planner generates 4-task DAG (check balance, find yield, bridge, deposit)
→ Planner DAG renders as visual flowchart

0:25–0:38
Orchestrator broadcasts to 3 Bridge Agents
→ Real-time bids appear on screen:
  • Stargate: $1.15, 96% confidence, risk score 88
  • Curve: $0.89, 92% confidence, risk score 75
  • Celer: $1.05, 94% confidence, risk score 81

0:38–0:50
Multi-factor scoring engine evaluates:
→ Stargate: 92.0 / 100 (highest safety)
→ Celer: 89.5 / 100
→ Curve: 79.6 / 100 (reputation below user's 80 threshold, rejected)
→ Display reasoning: "Stargate selected for 17% higher safety despite 29% higher cost. Meets all policies."

0:50–1:05
Escrow locks ($5,000 held)
→ Stargate executes bridge
→ TX hash appears
→ Execution completes in 41 seconds (better than promised 42s)

1:05–1:20
Verification passed
→ Escrow released
→ ISA wallet shows fee accrual: $1.15
→ Agent reputation ticks up (92.0 → 92.1)

1:20–1:35
Full audit trail renders:
```
10:00 Intent Received
10:03 Planner Generated 4 Tasks
10:03 Broadcast to 3 Agents
10:03 3 Responses (1 rejected)
10:03 Stargate Selected (Safety: 92 vs Curve: 79)
10:03 Escrow Locked
10:09 Bridge Confirmed
10:10 Fee Accrued: $1.15
✓ Complete
```

→ **Final message:** "Your $5K USDC is now earning 8.4% APY on Base. ISA will auto-rebalance monthly. Audit trail [here]."

---

## 13. Success Metrics

✅ **Technical Success**
- [ ] MVP flow runs 10+ consecutive times without failure
- [ ] Escrow lock/release works with real OKX.AI primitives
- [ ] Reputation Oracle lookups are fast (<1 second)
- [ ] Audit trail is human-readable and complete
- [ ] Multi-factor decision engine produces explainable scores

✅ **Submission Success**
- [ ] ASP passes OKX.AI internal review
- [ ] ASP goes live on OKX.AI Marketplace
- [ ] At least 1 full end-to-end execution live during demo
- [ ] At least 1 live failure/reputation-slashing moment demonstrated
- [ ] All 3 specialist agents actively bid and compete

✅ **Market Success**
- [ ] X post with #OKXAI reaches 500+ impressions
- [ ] Audit trail is inspectable by external judges
- [ ] Revenue model (coordination fee) is visible and real
- [ ] Judges can understand the ecosystem play (not just a single app)

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| OKX.AI review delays / rejects | Blockading | Submit Phase 1 early; keep MVP minimal and robust; maintain weekly check-ins |
| Multi-agent bidding breaks live | Demo fail | Always have single-agent fallback path; pre-test 5 times before demo |
| Escrow edge cases / bugs | Trust broken | Run 10 consecutive E2E tests; code review escrow logic twice |
| Reputation Oracle rate-limited | Flow halts | Implement caching; fallback to last-known scores |
| Scope creep (multi-chain, new intents) | Quality suffers | Explicitly fenced off; not touched until MVP + Should-Have stable |
| Agent network latency (slow bids) | Demo slow | Pre-seed agent responses; tune auction window; graceful timeout handling |

---

## 15. Open Questions

1. **Proof-of-Completion:** What are the safest, fastest proof methods within OKX.AI Onchain OS for bridge/swap/stake tasks? (Balance checks? TX hash validation? Signed attestations?)

2. **Audit Trail Storage:** Full onchain storage vs. hashed/anchored log? What's the gas budget for 10+ audit entries per execution?

3. **Real Specialist Agents:** By the time we're building, are there live ASPs on OKX.AI marketplace we can integrate as true bidders instead of self-building minimal ones?

4. **Reputation Seeding:** How should new agents earn their first reputation points to bootstrap in the marketplace?

---

## 16. Future Roadmap (Post-Hackathon)

**Near-term (Month 1–3):**
- Generalize intent schema beyond yield optimization (safe cross-chain transfer, portfolio rebalancing, tax-loss harvesting, etc.)
- Publish negotiation protocol as open standard
- Release SDK for competing orchestrator builders

**Medium-term (Month 3–6):**
- 3+ chain support (Arbitrum, Optimism, Polygon)
- Third-party insurance layer for A2A deals
- Agent marketplace goes live with open agent registration
- MCP plugin integrations (news, calendar, email)

**Long-term (Month 6+):**
- Non-crypto intents (travel booking, subscription management)
- Multi-layer orchestration (orchestrator hiring other orchestrators)
- DAO governance for ISA protocol evolution
- Cross-chain atomic settlements with timeout guarantees

---

## 17. Appendix: Intent Templates (Should-Have S1)

### Template: Maximize Stablecoin Yield
```json
{
  "name": "Maximize Stablecoin Yield",
  "description": "Deploy stablecoins to the highest-yield safe protocols",
  "default_constraints": {
    "min_apy": 0.08,
    "max_slippage_pct": 0.3,
    "require_audit": true,
    "min_tvl_usd": 50000000,
    "max_gas_usd": 5,
    "approval_threshold_usd": 1000
  },
  "rebalance_frequency": "monthly",
  "risk_preference": "safety_first"
}
```

### Template: Weekly Portfolio Rebalance
```json
{
  "name": "Weekly Portfolio Rebalance",
  "description": "Maintain target allocation (e.g. 60% USDC, 40% ETH)",
  "target_allocation": {
    "USDC": 0.60,
    "ETH": 0.40
  },
  "rebalance_frequency": "weekly",
  "tolerance_pct": 5,
  "max_gas_usd": 10
}
```

### Template: Safe Cross-Chain Transfer
```json
{
  "name": "Safe Cross-Chain Transfer",
  "description": "Move assets with minimal slippage and maximum security",
  "max_slippage_pct": 0.1,
  "min_protocol_risk_score": 85,
  "approval_required": true,
  "insurance_preferred": true
}
```

---

## 18. Appendix: Agent Interface (For SDK / C1)

Specialist agents must implement this interface:

```typescript
interface SpecialistAgent {
  // Metadata
  agentId: string;
  wallet: string;
  capabilities: string[]; // ["bridge", "swap", "stake"]
  reputation: number; // 0–100

  // RPC Endpoint
  async respondToTask(rFQ: RequestForQuote): Promise<Bid>;

  // Execution
  async executeTask(task: Task): Promise<ExecutionProof>;

  // Proof
  async provideProof(taskId: string): Promise<Proof>;
}

interface Bid {
  agentId: string;
  taskId: string;
  quote: {
    feeUsd: number;
    etaSeconds: number;
    confidence: number;
  };
  analysis: {
    riskScore: number;
    slippageEstimatePct: number;
  };
}

interface Proof {
  txHash: string;
  status: "confirmed" | "failed";
  actualFeeUsd: number;
  actualExecutionSeconds: number;
}
```

---

**Status:** Draft v2.0 — Feedback-integrated, ready for Phase 1 kickoff.