# PRD: Intent Settlement Agent (ISA)
### "The agent that hires other agents"

**Built for:** OKX.AI Genesis Hackathon (Submissions: Jul 3 – Jul 17, 2026, 23:59 UTC)
**Type:** Agent Service Provider (ASP) — Onchain agent coordination / orchestration layer
**Primary Tracks:** Best Product, Finance Copilot, Revenue Rocket
**Status:** Draft v1.0

---

## 1. One-Line Pitch

An agent that doesn't just move your money — it hires other agents to do it, fires the ones that cheat, and gets smarter about who to trust every time.

## 2. Problem Statement

Today's "AI crypto agents" are single-purpose wrappers around one action — swap, stake, bridge. None of them **coordinate with each other**. A user with a real financial goal ("get me the best yield across chains, safely, and rebalance weekly") still has to manually chain together five different tools, trust each one blindly, and has no record of *why* any decision was made.

OKX.AI's A2A/A2MCP primitives make it possible for agents to pay other agents for sub-tasks with escrow-backed trust. Almost nobody is actually building on that primitive yet — most hackathon entries will be single agents calling APIs, not agents economically coordinating with other agents. That gap is the opportunity.

## 3. Goals

- Demonstrate a **real, live, working example of an agent economy**: one orchestrator agent decomposing a goal and paying specialist agents to execute pieces of it, using genuine A2A escrow — not simulated calls.
- Prove the system is **trustless, not just automated**: it must detect and financially punish a non-performing counterparty agent live, not just in theory.
- Prove **economic viability**: the orchestrator earns a visible, onchain, real-time fee for coordination — a working revenue model, not a projection.
- Ship something that **passes OKX.AI's internal review and goes live on the marketplace** — reliability and completion matter as much as ambition.
- Make the underlying protocol (intent schema + negotiation format) **reusable by other ASP builders**, positioning ISA as ecosystem infrastructure rather than a single bot.

## 4. Non-Goals (v1)

- Full multi-chain support (v1 targets 2 chains max).
- General-purpose intent handling for arbitrary financial goals (v1 supports one well-defined intent family: cross-chain yield optimization + rebalancing).
- Building the specialist agents themselves as separate production-grade ASPs (v1 may use minimal but real specialist agents, not third-party ones, to keep the demo self-contained and reliable).
- Non-crypto intents (explicitly out of scope for v1, called out as roadmap).

## 5. Target Users

| User | Need |
|---|---|
| Retail crypto holder | Wants "set and forget" cross-chain yield without manually bridging/swapping/staking |
| Other ASP builders | Want a reputation-aware counterparty and a negotiation protocol they can plug into rather than building their own from scratch |
| OKX.AI platform | Wants a flagship demonstration of the A2A economy actually functioning, with visible trust and revenue mechanics |

## 6. Track & Judging Alignment

| Criterion (typical: Innovation, Market Value, Completion, Demo) | How ISA delivers |
|---|---|
| Innovation | First live agent-hires-agent orchestration with real-time competitive bidding and reputation-based counterparty selection |
| Market Value | Visible, onchain fee-per-orchestration revenue model; protocol is reusable by other builders (ecosystem multiplier) |
| Completion | Must pass OKX.AI review + go live on marketplace; MVP scope is deliberately narrow to guarantee a working, approved submission |
| Demo | Live auction + live failure/slashing event + live fee accrual — three distinct "show, don't tell" moments in under 90 seconds |

---

## 7. Product Narrative / User Flow

1. User connects wallet and types (or selects) an intent: *"Optimize my USDC yield across Chain A and Chain B, rebalance weekly, keep risk low, gas budget under $5."*
2. **Intent Parser** converts this into a structured goal object.
3. **Planner** decomposes the goal into an ordered task list (check balances → find best yield route → bridge if needed → deposit → schedule next check).
4. **Orchestrator** broadcasts each task to the open agent network. Eligible **Specialist Agents** (Bridge Agent, Yield Agent, Swap Agent) respond with live bids (price, time estimate, confidence).
5. Orchestrator cross-checks each bidder's **onchain reputation score** before accepting. Low-reputation bidders are excluded regardless of price.
6. Winning bid is locked via **A2A escrow**. Specialist agent executes. On verified completion, escrow releases; on failure or misbehavior, escrow is withheld and the specialist's reputation is slashed.
7. Every decision (why a bid was chosen, why one was rejected, what reputation gated it) is written to an **onchain audit trail**.
8. Orchestrator takes a small coordination fee from the transaction, visible in its own wallet balance in real time.
9. User receives a plain-English settlement report with a link to the full audit trail.

---

## 8. System Architecture

```
                        ┌─────────────────────┐
                        │   User (NL Intent)   │
                        └──────────┬───────────┘
                                   ▼
                        ┌─────────────────────┐
                        │   Intent Parser      │  (LLM → structured JSON)
                        └──────────┬───────────┘
                                   ▼
                        ┌─────────────────────┐
                        │   Planner (DAG)      │
                        └──────────┬───────────┘
                                   ▼
                 ┌─────────────────────────────────┐
                 │   Orchestrator Agent (ISA core)  │◄────────────┐
                 └───────┬───────────────┬──────────┘             │
                         │               │                         │
           broadcast task│               │query reputation         │
                         ▼               ▼                         │
              ┌─────────────────┐  ┌──────────────────────┐        │
              │ Specialist Agent │  │ Reputation Oracle ASP │        │
              │  Bid Auction     │  │ (onchain tx history + │        │
              │ (Bridge / Yield /│  │  gated human reviews) │        │
              │  Swap agents)    │  └──────────────────────┘        │
              └────────┬─────────┘                                 │
                       ▼                                            │
              ┌──────────────────┐        outcome feeds back        │
              │  A2A Escrow Lock  │────────────────────────────────┘
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Execution + Proof │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Onchain Audit Log │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  User Report /    │
              │  Fee Accrual      │
              └──────────────────┘
```

---

## 9. Feature List

### 9.1 MVP (Must-Have — required for a valid, live, approvable submission)

| # | Feature | Description |
|---|---|---|
| M1 | Intent Parser | NL → structured JSON intent (goal, constraints, assets, chains, risk tolerance) |
| M2 | Rule-based Planner | Deterministic task DAG generation for the single supported intent family (yield optimization + rebalance) |
| M3 | Orchestrator Core | Broadcasts tasks, collects bids, selects a winner, initiates escrow |
| M4 | Single-round Bidding | At least 2 specialist agents return real quotes for a given task |
| M5 | Reputation Gate | Orchestrator queries a reputation score before accepting any bid; hard-rejects below threshold |
| M6 | A2A Escrow Integration | Real Onchain OS / Agentic Wallet escrow lock and release, not mocked |
| M7 | Execution Verification | Proof-of-completion check before releasing escrow (e.g. confirmed balance change, tx hash validation) |
| M8 | Audit Trail | Immutable, human-readable log of every decision, written onchain or to a verifiable store |
| M9 | Coordination Fee | Orchestrator takes a small % fee per completed task, visible in its wallet |
| M10 | OKX.AI Listing | Passes internal review, live on OKX.AI Marketplace with a working A2MCP/A2A entry point |
| M11 | 2-Chain, 1-Asset Scope | Single stablecoin, two chains, one full end-to-end path fully working |

### 9.2 Should-Have (differentiators — build after MVP is solid)

| # | Feature | Description |
|---|---|---|
| S1 | Live Competitive Auction | Multiple specialist agents bid in real time with visible price discovery, not a single quote lookup |
| S2 | Failure Injection / Slashing Demo | One specialist intentionally underperforms; system detects it, withholds escrow, slashes reputation, reroutes to next-best bidder |
| S3 | Reputation Flywheel | ISA's own outcomes (as both principal and counterparty) write back into the reputation oracle, closing the loop |
| S4 | Scheduled Rebalancing | Weekly recurring execution without new user input |
| S5 | Explainability Report | Plain-English breakdown of "why this route, why this agent, what it cost, what was checked" |

### 9.3 Could-Have (stretch / roadmap)

| # | Feature | Description |
|---|---|---|
| C1 | Open Intent Schema Spec | Publish the JSON schema + negotiation protocol publicly so other ASP builders can plug in |
| C2 | Multi-chain (3+) support | Beyond the MVP's 2-chain scope |
| C3 | Non-crypto intent support | Generalize the orchestration pattern to non-financial workflows (per OKX.AI's "beyond crypto" mandate) |
| C4 | Human-in-the-loop override | For large transactions, pause and request explicit user confirmation with a risk explanation |
| C5 | Insurance layer | Optional premium paid to cover failed A2A deals (see: escrow underwriter concept) |

---

## 10. Detailed Component Specs

### 10.1 Intent Parser
- **Input:** Free text from user.
- **Output:** Structured JSON (see schema below).
- **Method:** Single LLM call with a constrained JSON-only system prompt and few-shot examples.
- **Fallback:** If parsing confidence is low, ask a single clarifying question rather than guessing.

```json
{
  "goal": "yield_optimization",
  "assets": [{ "symbol": "USDC", "amount": 500 }],
  "chains_allowed": ["ChainA", "ChainB"],
  "constraints": {
    "risk_tolerance": "low",
    "gas_budget_usd": 5,
    "rebalance_cadence": "weekly"
  }
}
```

### 10.2 Planner
- Deterministic (rule-based) for MVP — avoids unnecessary LLM latency/cost on the critical path.
- Produces an ordered task list: `check_balances → find_best_yield_route → bridge_if_needed → deposit → (schedule_next_check)`.

### 10.3 Orchestrator / Negotiation Layer
- Broadcasts each task as a request-for-quote to eligible specialist agents.
- Collects bids within a fixed time window (e.g. 5–10 seconds for demo purposes).
- Filters bids by reputation threshold before ranking by price/time/confidence.
- Selects winner, initiates A2A escrow lock.

**Bid schema:**
```json
{
  "agent_id": "bridge-agent-01",
  "task_id": "bridge_500_usdc_A_to_B",
  "quote_fee_usd": 1.10,
  "eta_seconds": 45,
  "confidence": 0.97
}
```

### 10.4 Reputation Oracle Integration
- Queries onchain transaction history + any gated human review signals for a given agent address.
- Returns a single normalized trust score (0–100).
- Orchestrator enforces a hard minimum threshold; bids below it are excluded from ranking entirely, regardless of price.
- **Flywheel (S3):** every completed (or failed) task ISA participates in writes an outcome record back to the oracle, so the trust graph updates from real activity, not just historical data.

### 10.5 A2A Escrow Flow
1. Orchestrator locks funds against the winning specialist agent's task.
2. Specialist executes and submits proof of completion (tx hash / verifiable state change).
3. Orchestrator's verification step checks the proof against expected outcome.
4. **Success:** escrow releases to specialist, minus ISA's coordination fee.
5. **Failure/mismatch:** escrow is withheld, dispute is logged, specialist's reputation score is decremented, task is rerouted to the next-ranked bidder.

### 10.6 Audit Trail
- Every orchestration decision (bids received, bid selected, reputation scores checked, escrow events, final outcome) is written to an append-only, verifiable log — ideally onchain, or a signed/hashed log anchored onchain if full onchain storage is too costly for the hackathon window.
- Exposed to the user as a plain-English settlement report with a link/reference to the raw trail.

### 10.7 Revenue Model
- ISA charges a small coordination fee (e.g. 0.2–0.5%) on every successfully completed task.
- Fee accrues to ISA's own Agentic Wallet — demoable live as a visible balance change.
- This is the concrete "Revenue Rocket" proof point: real fees, earned live, not a slide.

---

## 11. OKX.AI Platform Integration

| Primitive | Usage |
|---|---|
| **Onchain OS skills** (`npx skills add okx/onchainos-skills`) | Wallet management, transaction execution, escrow primitives |
| **Agentic Wallet** | ISA's own wallet for holding coordination fees and initiating escrow locks |
| **A2A (escrow)** | Used for all orchestrator ↔ specialist agent task settlements |
| **A2MCP (pay-per-call)** | Used for the reputation oracle lookups (ISA pays per query) |
| **Marketplace Listing** | ISA must be submitted for internal review and go live to be a valid hackathon entry — treated as a hard MVP requirement, not a nice-to-have |

---

## 12. Non-Functional Requirements

- **Reliability:** The MVP flow (M1–M11) must run end-to-end without manual intervention at least 10 times in a row before submission — this directly protects against review/listing failure.
- **Latency:** Full orchestration (parse → bid → escrow → settle) should complete within ~60 seconds for demo purposes.
- **Transparency:** Every fund movement must be traceable to a specific decision in the audit trail.
- **Security:** Escrow release logic must never release funds without a verified proof-of-completion check — this is the core trust guarantee of the entire product.

---

## 13. Build Plan (Phased, given the Jul 3–17 window)

**Phase 1 — Baseline (get something live fast)**
- Intent parser + rule-based planner
- One specialist agent (real, minimal) + orchestrator talking to it directly (no bidding yet)
- Real A2A escrow lock/release on a single task
- Submit for OKX.AI review early — this is the highest-risk, longest-lead-time dependency

**Phase 2 — Differentiation layer**
- Second and third specialist agents → real competitive bidding (S1)
- Reputation gate wired to a real oracle (M5)
- Audit trail (M8)
- Coordination fee visible in wallet (M9)

**Phase 3 — The winning moments**
- Failure injection + slashing demo (S2)
- Reputation flywheel closing the loop (S3)
- Explainability report polish (S5)
- Rehearse the live demo script end-to-end multiple times

**Phase 4 — Packaging**
- X post with #OKXAI: clear use case, demo/walkthrough per submission requirements
- Publish open intent schema (C1) if time allows, as an ecosystem-goodwill add-on

---

## 14. Demo Script (target: under 90 seconds)

1. **(0:00–0:15)** User types intent in plain English. Show structured JSON appear instantly.
2. **(0:15–0:35)** Show live bidding: 3 specialist agents respond with real quotes, reputation scores visible next to each.
3. **(0:35–0:55)** Escrow locks with winning bid. **One agent is shown failing/misbehaving on a second task** — escrow withheld, reputation score drops live, task automatically reroutes.
4. **(0:55–1:15)** Successful settlement completes. Show ISA's wallet balance tick up with the coordination fee, live.
5. **(1:15–1:30)** Close on the audit trail / settlement report — "here's exactly why every decision was made."

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| OKX.AI review/listing delays or rejects the ASP | Submit the Phase 1 baseline for review as early as possible; keep MVP scope minimal and robust |
| Multi-agent bidding demo breaks live | Always have Phase 1's single-agent flow as a guaranteed fallback demo path |
| Escrow/verification logic has edge-case bugs | Run 10+ consecutive successful end-to-end test runs before submission |
| Reputation oracle unavailable/rate-limited | Cache last-known scores; degrade gracefully rather than blocking the whole flow |
| Scope creep into multi-chain / non-crypto intents | Explicitly fenced off as Could-Have; not touched until MVP + Should-Have are done and stable |

---

## 16. Success Metrics (for the submission itself)

- ✅ ASP passes OKX.AI internal review and is live on the marketplace
- ✅ At least one full end-to-end orchestration completes live during the demo, with real escrow and real fee accrual
- ✅ At least one live failure/reputation-slashing event is demonstrated
- ✅ X post with #OKXAI published with a clear use case and walkthrough
- ✅ Audit trail is inspectable and understandable by someone outside the team

---

## 17. Open Questions

- What specific proof-of-completion checks are feasible within the hackathon's available Onchain OS primitives for each task type (bridge, swap, stake)?
- Is full onchain storage for the audit trail feasible within gas/time budget, or should it be a hashed/anchored log instead?
- Are there already other ASPs live on OKX.AI by the time of building that could serve as *real* specialist agents instead of self-built ones — would strengthen the "real agent economy" story further?

---

## 18. Future Roadmap (post-hackathon)

- Generalize the intent schema beyond crypto (travel booking, subscription management, etc.) per OKX.AI's "beyond crypto" mandate
- Publish the negotiation protocol as an open standard for other ASP builders
- Add the optional insurance/underwriting layer for A2A deals
- Expand to 3+ chains and additional intent families
