# Intent Settlement Agent (ISA)

[![Project Status: MVP](https://img.shields.io/badge/Status-MVP%20Ready-brightgreen.svg)](#)
[![Stack: Monorepo / Bun](https://img.shields.io/badge/Stack-Monorepo%20%7C%20Bun-blue.svg)](#)
[![Target: OKX.AI Genesis Hackathon](https://img.shields.io/badge/Target-OKX.AI%20Hackathon-orange.svg)](#)

> **"The Operating System for Agent-Coordinated Finance"**
> 
> *An AI-powered financial operating system that transforms natural language intents into autonomous, explainable, and verifiable on-chain execution on X Layer using specialized, competing AI agents.*

---

## 📖 Table of Contents

- [1. Executive Summary & Pitch](#1-executive-summary--pitch)
- [2. The Three Paradigm Shifts](#2-the-three-paradigm-shifts)
- [3. Key Features](#3-key-features)
- [4. High-Level Architecture](#4-high-level-architecture)
- [5. System Directory Structure](#5-system-directory-structure)
- [6. Smart Contract Architecture (X Layer)](#6-smart-contract-architecture-x-layer)
- [7. Core Logic Deep Dive](#7-core-logic-deep-dive)
  - [7.1 Intent Parsing Schema](#7.1-intent-parsing-schema)
  - [7.2 Multi-Factor Decision Engine](#7.2-multi-factor-decision-engine)
  - [7.3 Reputation & Feedback Loop](#7.3-reputation--feedback-loop)
- [8. Technology Stack](#8-technology-stack)
- [9. Visual Identity & Brand System](#9-visual-identity--brand-system)
- [10. Setup & Local Development](#10-setup--local-development)
  - [10.1 Prerequisites](#10.1-prerequisites)
  - [10.2 Installation](#10.2-installation)
  - [10.3 Running Locally](#10.3-running-locally)
  - [10.4 Smart Contract Tests](#10.4-smart-contract-tests)
- [11. Submission Metadata](#11-submission-metadata)

---

## 1. Executive Summary & Pitch

In the current Web3 landscape, executing complex, multi-step DeFi actions requires users to either chain protocols together manually or trust a single, monolithic AI agent blindly. Existing agents operate in silos with no coordination, no transparent reputation systems, and no safety rails.

**Intent Settlement Agent (ISA)** changes this by introducing a decentralized, multi-agent financial operating system. 

Instead of writing custom scripts or interacting with fragmented UIs, the user simply describes their high-level objective in plain English (e.g., *"Keep my USDT earning the highest safe yield across Base and Ethereum"*). ISA then:
1. Parses the query into structured policies.
2. Formulates a step-by-step execution plan (DAG).
3. Conducts a reverse auction where multiple specialized agents compete to execute tasks.
4. Selects the optimal agent using a multi-factor scoring algorithm.
5. Locks funds in an escrow contract, releasing them only upon verified completion.

By turning agent-to-agent (A2A) economic coordination into a protocol standard, ISA builds a thriving on-chain marketplace where agent developers can monetize specialized utilities (bridging, swapping, yield farming, gas optimization) under a secure, reputation-backed trust layer.

---

## 2. The Three Paradigm Shifts

```
┌────────────────────────────────────────────────────────────────────────┐
│                              ISA Core Shifts                           │
│                                                                        │
│ 1. One-Shot Execution    ───►    Continuous Policy-Based Automation    │
│ 2. Arbitrary Trust       ───►    Multi-Factor Decision & Reputation    │
│ 3. Siloed Solvers        ───►    Open Competitive Agent Marketplace    │
└────────────────────────────────────────────────────────────────────────┘
```

1. **From One-Shot Actions to Continuous Policies**  
   Instead of running a one-off transfer or swap, users define long-running rules (e.g., *"Rebalance monthly. Yield target: 8%+ APY. Alert me before moving > $1k"*). ISA continuously monitors positions and triggers rebalancing events autonomously.
2. **From Reputation-Only to Multi-Factor Audits**  
   Decision-making isn't just about selecting the cheapest fee. The engine balances Agent Reputation, Protocol Risk, Liquidity depth, Slippage constraints, and Gas cost to output an explainable choice.
3. **From Closed APIs to an Open Marketplace**  
   Any developer can register their agent. Agents build a history of successful execution, earn fees, increase their on-chain trust score, and climb the Leaderboard.

---

## 3. Key Features

- 🧠 **Natural Language Intent Parsing:** Converts complex, conversational text into strict JSON goals, asset mappings, and risk parameters.
- ⚡ **Rule-Based Task Planner:** Dynamically generates a Directed Acyclic Graph (DAG) representing the required blockchain actions (balance checks, bridges, swaps, deposits).
- 🏆 **Agent Bidding & Orchestration:** Implements an automated Request for Quote (RFQ) loop where specialized agents bid for execution tasks.
- 🛡️ **On-Chain Escrow & Verification:** Uses custom smart contracts on OKX's **X Layer** to lock funds, ensuring that payout only occurs when cryptographic proof of task completion is verified.
- 📊 **Explainability Timeline:** Breaks down AI decisions in a transparent, human-readable UI, showing exactly why a bidder was accepted or filtered out.
- 📈 **Portfolio Dashboard:** Comprehensive metrics tracking active positions, APY yields, historical coordination fees, and agent ratings.

---

## 4. High-Level Architecture

```
                    ┌──────────────────────────┐
                    │   User (NL Intent)       │
                    │   + Policy Profile       │
                    └────────────┬─────────────┘
                                 │ (Submit Intent)
                                 ▼
                    ┌──────────────────────────┐
                    │   Intent Parser (LLM)    │
                    └────────────┬─────────────┘
                                 │ (Structured JSON Intent)
                                 ▼
                    ┌──────────────────────────┐
                    │    Rule-Based Planner    │
                    └────────────┬─────────────┘
                                 │ (Task DAG Generator)
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│                  Orchestrator Agent (ISA Core)               │
│  ├─ Intent Store (database tracking)                          │
│  ├─ Multi-Factor Decision Engine                             │
│  └─ Escrow Manager Interface                                 │
└──────┬────────────────────────────────────────────────┬──────┘
       │                                                │
       │ (Task Broadcast / RFQ)                         │ (Query Reputation)
       ▼                                                ▼
┌──────────────────────┐                     ┌──────────────────────┐
│  Specialist Agents   │                     │  Reputation Oracle   │
│  ├─ Swap Agent       │                     │  (On-Chain Ledger)   │
│  ├─ Bridge Agent     │                     │                      │
│  └─ Yield Agent      │                     │  + Learning Engine   │
└──────┬───────────────┘                     └──────────┬───────────┘
       │ (Bids with quotes & risk)                      │
       └────────────────────────┬───────────────────────┘
                                │ (Optimal Agent Selected)
                                ▼
                   ┌──────────────────────────┐
                   │     X Layer Escrow       │ ◄── [User locks funds]
                   └────────────┬─────────────┘
                                │ (Triggers Execution)
                                ▼
                   ┌──────────────────────────┐
                   │    DeFi Protocols        │ ◄── [Execution on-chain]
                   └────────────┬─────────────┘
                                │ (Transaction Proof / Tx Hash)
                                ▼
                   ┌──────────────────────────┐
                   │  Verification Service    │
                   └────────────┬─────────────┘
                                │ (Outcome Verified)
                                ▼
                   ┌──────────────────────────┐
                   │    Settlement & Fees     │ ◄── [Payout Agent + Fee Accrual]
                   └────────────┬─────────────┘
                                │
                                ▼
                   ┌──────────────────────────┐
                   │    On-Chain Audit Log    │
                   └──────────────────────────┘
```

---

## 5. System Directory Structure

The project is managed as a high-performance **TypeScript Monorepo** using the **Bun** package manager and workspaces:

```text
.
├── apps/
│   ├── frontend/         # Next.js 16 Web Dashboard UI (Tailwind CSS v4, Wagmi, Zustand)
│   └── backend/          # Hono API Server, tRPC endpoints, and Inngest scheduled monitoring
│
├── packages/
│   ├── ai/               # Intent Parser, Task Planner, and Explainability prompts & schemas
│   ├── contracts/        # Foundry-based Solidity contracts deployed on X Layer
│   └── database/         # Drizzle PostgreSQL ORM models, schemas, and seeding files
│
├── ARD.md                # Architecture Reference Document & Roadmap status
├── design.md             # UI/UX Styleguide, theme tokens, and cyber-functional color specifications
├── hackathon.md          # Winning strategy overview for the OKX.AI Genesis Hackathon
├── intent-settlement-agent-prd.md # Complete Product Requirements Document
├── xlayer-integration.md # Blockchain integration spec and transaction flows
├── package.json          # Monorepo workspaces & build scripts configuration
└── bunfig.toml           # Configuration parameters for the Bun runtime environment
```

---

## 6. Smart Contract Architecture (X Layer)

The contracts are built in Solidity and compiled/tested using the **Foundry** environment. They govern the trustless asset escrow and verification loop:

- **[AgentRegistry.sol](file:///home/lviffy/Projects/OKX/packages/contracts/src/AgentRegistry.sol)**: Houses metadata, status, addresses, and capabilities (e.g., swapping, bridging) of all active agents qualified to submit bids.
- **[Escrow.sol](file:///home/lviffy/Projects/OKX/packages/contracts/src/Escrow.sol)**: Locks the user's funds upon job confirmation. Ensures funds cannot be arbitrarily withdrawn by agents. Supports `releaseFunds()` upon verification and `refund()` on execution timeout.
- **[Reputation.sol](file:///home/lviffy/Projects/OKX/packages/contracts/src/Reputation.sol)**: Tracks on-chain metrics (total tasks, success rate, latency, volume). Feeds directly into the decision engine to filter out bad actors.
- **[Settlement.sol](file:///home/lviffy/Projects/OKX/packages/contracts/src/Settlement.sol)**: Distributes funds from the escrow to the successful execution agent while separating the platform coordination fee (0.2% - 0.5%) and updating the reputation contract.

---

## 7. Core Logic Deep Dive

### 7.1 Intent Parsing Schema
The **[packages/ai](file:///home/lviffy/Projects/OKX/packages/ai)** service parses the user's natural language goal into a structured schema:

```json
{
  "type": "yield_optimization",
  "assets": [{"symbol": "USDC", "amount": 10000}],
  "chains": ["ethereum", "base"],
  "policies": {
    "protocol_constraints": {
      "require_audit": true,
      "min_protocol_risk_score": 75,
      "min_tvl_usd": 50000000
    },
    "execution_constraints": {
      "max_slippage_pct": 0.5,
      "max_gas_per_tx_usd": 5
    }
  }
}
```

### 7.2 Multi-Factor Decision Engine
During a reverse auction, the engine scores each incoming bid according to the following weights:
- **Reputation (40%)**: Historical on-chain performance.
- **Protocol Risk (25%)**: TVL, exploit history, and audits.
- **Liquidity (15%)**: Liquidity depth available in the solver.
- **Slippage (10%)**: Expected slippage impact of the trade.
- **Cost (10%)**: Execution fee + estimated gas.

```javascript
const scoreAgent = (bid, policies) => {
  if (bid.reputation < policies.min_reputation_score) {
    return { score: 0, rejected: true, reason: "reputation_gate_failed" };
  }
  
  return (
    bid.reputation * 0.40 +
    bid.risk_score * 0.25 +
    bid.liquidity_factor * 0.15 +
    bid.slippage_score * 0.10 +
    bid.cost_score * 0.10
  );
};
```

### 7.3 Reputation & Feedback Loop
On execution completion, the orchestrator triggers an automated check:
- **Success**: Funds are released from `Escrow.sol`. Reputation increases. A coordination fee accrues to the treasury.
- **Failure**: Task triggers automatic rollback or redirects to the runner-up agent. Reputation of the failed agent is slashed.

---

## 8. Technology Stack

### Frontend & Dashboard
* **Next.js 16 (App Router)** & React 20 – High-performance rendering & state layout.
* **Tailwind CSS v4 & shadcn/ui** – For sleek, modern components.
* **Wagmi & Viem** – Wallet connections (OKX Wallet, Metamask) and RPC interaction.
* **Zustand** – Client-side global state management.

### Backend & Database
* **Hono** – Lightweight, speed-optimized router API framework.
* **tRPC** – End-to-end type safety mapping database schema and endpoints to frontend forms.
* **Drizzle ORM** – Type-safe TypeScript ORM connecting to PostgreSQL database.
* **Inngest** – Handles complex workflow scheduling, continuous monitoring, and async retries.
* **Redis** – Auction states, rate-limiting, and short-term caching.

### Smart Contracts & AI
* **Solidity & Foundry** – Smart contracts compiled, tested, and optimized.
* **OKX AI SDK** – Agent-to-Agent (A2A) protocol implementation.
* **Vercel AI SDK** – LLM integrations (GPT/Claude) for parser and planner.

---

## 9. Visual Identity & Brand System

ISA features the **Cyber-Protocol** design system: a combination of **Corporate Minimalism** and **Cyber-Functionalism**. 

- **The Palette**:
  - **Void (`#0B0E11`)** and **Slate (`#111417`)**: Base background containers.
  - **Accent Lime (`#CCFF00`)**: Used selectively for critical success actions, glowing badges, and execution routes.
  - **Secondary (`#FFFFFF`)**: Crisp, readable typography.
- **Typography**: Uses **Inter** for standard UI layouts and **JetBrains Mono** for on-chain telemetry data, addresses, and execution parameters.
- **UI Elements**: Accentuated by subtle monospace grid overlays, 1px division borders, and active status indicators.

---

## 10. Setup & Local Development

### 10.1 Prerequisites
Ensure you have the following installed on your local environment:
- [Bun Runtime](https://bun.sh) (v1.0 or later)
- [Docker](https://www.docker.com/) (For PostgreSQL & Redis instances)
- [Foundry CLI](https://book.getfoundry.sh/getting-started/installation) (For Solidity testing and compilation)

### 10.2 Installation
Clone the repository and install all dependencies:
```bash
bun install
```

### 10.3 Running Locally

1. **Environment Config**:  
   Duplicate the `.env.example` files in `apps/frontend` and `apps/backend` to `.env` and fill in your API credentials (LLM providers, Database URLs).

2. **Spin Up Infrastructure**:  
   Initialize the database container:
   ```bash
   docker-compose up -d
   ```

3. **Database Setup**:  
   Push the schema to your local database and run the seeds:
   ```bash
   bun --filter "database" db:push
   bun --filter "database" db:seed
   ```

4. **Start Dev Servers**:  
   Run the development environment for all monorepo applications:
   ```bash
   bun dev
   ```

   This launches:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)

### 10.4 Smart Contract Tests
Run Solidity unit and integration tests using Foundry:
```bash
cd packages/contracts
forge test
```

---

## 11. Submission Metadata

* **Hackathon Submission:** OKX.AI Genesis Hackathon
* **Submission Deadline:** July 17, 2026, 23:59 UTC
* **Tracks Entered:** Best Product, Finance Copilot, Revenue Rocket, Infrastructure
* **Target Network:** X Layer (Testnet & Mainnet)

---
*Created with 💚 for the OKX.AI Genesis Hackathon.*
