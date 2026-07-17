# Helix Protocol — X Layer Testnet Deployment Guide

This guide outlines the exact steps to compile and deploy the Helix Protocol smart contracts onto the **X Layer Testnet** and wire them to your backend service.

---

## 📋 Prerequisites

1. **Testnet OKB (Gas)**: 
   * Obtain testnet OKB from the official faucet: [OKX X Layer Faucet](https://www.okx.com/xlayer/faucet).
   * Send the testnet OKB to your deployment wallet address.

2. **Foundry Toolchain**:
   * Make sure Foundry is installed. If not, run:
     ```bash
     curl -L https://foundry.paradigm.xyz | bash
     ```
   * Open a new terminal session, then run `foundryup` to pull the latest binaries (`forge`, `cast`, `anvil`).

---

## 🚀 Deployment Steps

### 1. Compile Contracts

Navigate to the contracts package directory and build the contracts to generate the ABIs:

```bash
cd packages/contracts
forge build
```

Verify that the build outputs exist in `packages/contracts/out`.

### 2. Run the Deployment Script

Deploy the contracts to X Layer Testnet using the deployment script we created:

```bash
forge script script/Deploy.s.sol \
  --rpc-url xlayer-testnet \
  --private-key YOUR_PRIVATE_KEY \
  --broadcast
```

*Replace `YOUR_PRIVATE_KEY` with your actual funded development wallet private key.*

### 3. Record Deployed Addresses

Once deployment completes, Foundry will write a summary of addresses. It will also generate a JSON file at:
`packages/contracts/script/deployed-addresses.json`

Open that file and copy the addresses into your backend configuration file at:
[`apps/backend/src/blockchain/addresses.json`](file:///home/lviffy/Projects/OKX/apps/backend/src/blockchain/addresses.json)

It should look like this:
```json
{
  "agentRegistry": "0x...",
  "reputation": "0x...",
  "escrow": "0x...",
  "treasury": "0x...",
  "settlement": "0x...",
  "intentStorage": "0x..."
}
```

### 4. Configure Backend Environment

Edit [`apps/backend/.env`](file:///home/lviffy/Projects/OKX/apps/backend/.env) and populate the following keys to activate live testnet execution:

```env
# The same private key you used to deploy the contracts (so it can execute Escrow/Settlement functions)
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# RPC override (optional)
XLAYER_TESTNET_RPC=https://testrpc.xlayer.tech
```

---

## 🧪 Verification & Execution

Once the addresses and keys are updated:

1. Restart the backend API:
   ```bash
   bun --filter backend dev
   ```
2. When you orchestrate intents from the dashboard frontend, the backend will now submit real transactions to **X Layer Testnet**!
3. Look for the `🔗 Transaction Hash` values printed in the console or shown in the frontend timeline, and trace them live on the [OKLink X Layer Testnet Explorer](https://www.oklink.com/xlayer-test).
