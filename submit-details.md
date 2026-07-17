# Helix Protocol — OKX.AI Genesis Hackathon Submission

## Official References
* **Developer Docs**: [ASP Registration Guide](https://web3.okx.com/onchainos/dev-docs/okxai/registerasp)
* **A2MCP Integration**: [How to MCP](https://web3.okx.com/onchainos/dev-docs/okxai/howtomcp)
* **A2A Integration**: [How to A2A Guide](https://web3.okx.com/onchainos/dev-docs/okxai/how-to-become-a2a)

## Project Details
- **Name**: Helix — The Financial Operating System for Autonomous AI Agents
- **Team**: Solo
- **Category**: DeFi / AI Agent Infrastructure
- **Live Demo**: http://localhost:3000 (local) | TBD (hosted)
- **Repo**: https://github.com/lviffy/OKX
- **Registered Agent ID**: `#6197`
- **Agent Owner Address**: `0xd04aacbf6ef8632ac97d7c47b4969e1770f094de`
- **Listing Status**: Under Review (Review submitted successfully on X Layer Mainnet)

---

## ASP Registration Steps (OKX OnchainOS)

Helix has been successfully registered on-chain as an ASP supporting both **A2MCP** (for the automated API tools) and **A2A** (for the orchestrated intent solver).

### Registered Services
1. **DeFi Telemetry and ExitGuard** (A2MCP - Automated API)
   * **Fee**: `0.05 USDT` per call (Gated via EIP-3009 payment signature)
   * **Endpoint**: `https://helix-mcp.finance/api/mcp`
2. **Helix Intent Solver** (A2A - Negotiated Task)
   * **Fee**: `0.10 USDT` (Escrow held on X Layer, settled upon milestone delivery)

### Verification Commands
To query this live ASP registration in OnchainOS CLI, run:
```bash
# Verify status and registration details
onchainos agent profile 6197
```

---


## Demo Script (90-Second Video)

### Scene 1 — Landing Page (0:00–0:10)
- Show **helix.finance** landing page
- Briefly: "Helix is the Financial Operating System for AI agents — natural language intents, settled autonomously on X Layer"

### Scene 2 — Intent Builder (0:10–0:30)
- Click **Launch Console → Intent Builder**
- Select template: **"Maximize Stablecoin Yield"**
- Fill in: `5000 USDC, Source: Ethereum, Target APY: 8%`
- Click **Preview Plan** → show dry-run DAG with 4 tasks:
  - `check_balances → bridge → check_exit_liquidity → deposit`

### Scene 3 — Live Auction (0:30–0:55)
- Click **Confirm & Execute**
- Show **Execution Timeline** animating in real-time:
  - Task 1 `check_balances` → Helix Oracle Agent wins (free oracle)
  - Task 2 `bridge` → **Auction opens**: Stargate vs Celer vs Curve bidding
  - **Score breakdown**: Reputation / Protocol Risk / Slippage / Cost / Liquidity
  - **Stargate selected** (Score: 87/100) — highest composite score
  - Escrow locked `0.01 OKB` → shown in timeline

### Scene 4 — Settlement Proof (0:55–1:15)
- Task 3 `check_exit_liquidity` → ExitGuard passes (slippage: 0.12%, OK)
- Task 4 `deposit` → Aave Yield Agent wins
- Escrow released → Settlement Tx Hash shown in timeline
- Final AI explanation: "Your 5000 USDC earned 8.2% APY on Aave via Stargate bridge"

### Scene 5 — On-Chain Proof (1:15–1:30)
- Open OKX block explorer → paste settlement Tx hash → verify
- Show intent record in IntentStorage contract
- Close: "Helix — The financial OS for the agentic economy. Built on X Layer."

---

## X (Twitter) Thread Template

**Tweet 1 — Hook**
> 🧵 Introducing Helix — the first Financial Operating System for autonomous AI agents, built on @OKX X Layer for the #OKXGenesisHackathon
>
> You write one sentence. Helix handles the rest — on-chain, auditable, zero-trust. 🔽

**Tweet 2 — Problem**
> DeFi is powerful but complex. You need to:
> - Find the best yield
> - Bridge cross-chain
> - Protect against depegs
> - Do it all automatically
>
> Nobody wants to manage this manually. That's what AI agents are for. But who manages the agents?

**Tweet 3 — Solution**
> Enter Helix.
>
> You submit: "Maximize my 5000 USDC yield, safety first"
>
> Helix:
> 1. Parses your intent with Gemini 2.5 Flash Lite 🧠
> 2. Generates a task DAG 📊
> 3. Runs a reverse auction between specialist agents 🏆
> 4. Locks escrow on X Layer 🔒
> 5. Settles with cryptographic proof ✅

**Tweet 4 — Tech Stack**
> Built with:
> - @OKX X Layer Testnet (escrow + settlement contracts)
> - Gemini 2.5 Flash Lite (intent parser + explainability)
> - Hono + Bun (backend API)
> - Next.js 14 (dashboard)
> - Drizzle + Postgres (audit trail)
> - x402 payment protocol (MCP tool gating)

**Tweet 5 — Demo**
> [VIDEO/GIF: 90-second demo]
>
> Watch an intent go from natural language → live auction → on-chain settlement in under 60 seconds.

**Tweet 6 — ASP on OKX.AI**
> Helix is registered as an ASP on @OKX.AI — both as an A2A agent (full intent orchestration) and A2MCP (x402-gated telemetry + liquidity tools).
>
> Any AI agent on the OKX marketplace can call our tools in real-time. 🤝

**Tweet 7 — CTA**
> Try it yourself →
>
> GitHub: https://github.com/lviffy/OKX
> Docs: (link)
>
> #OKXGenesisHackathon #DeFi #AIAgents #XLayer #Web3

---

## Checklist Before Submission
- [ ] Add `GEMINI_API_KEY` to `apps/backend/.env`
- [ ] Add Supabase keys to `apps/backend/.env` + `apps/frontend/.env`
- [ ] Run `bun --filter database db:push` (push schema to Supabase Postgres)
- [ ] Run `bun --filter database db:seed` (seed 6 mock agents)
- [ ] Test `bun dev` — verify http://localhost:3000 and http://localhost:4000/health
- [ ] Submit a test yield intent end-to-end
- [ ] Record 90-second demo video
- [ ] Register ASP on OKX OnchainOS (follow steps above)
- [ ] Post X thread
- [ ] Submit hackathon form before July 17, 23:59 UTC
