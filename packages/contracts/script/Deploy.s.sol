// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/Reputation.sol";
import "../src/Escrow.sol";
import "../src/Settlement.sol";
import "../src/Treasury.sol";
import "../src/IntentStorage.sol";

/**
 * @title Deploy
 * @notice Deploys the full Helix Protocol suite to X Layer Testnet.
 *
 * Run with:
 *   forge script script/Deploy.s.sol \
 *     --rpc-url $XLAYER_TESTNET_RPC \
 *     --private-key $DEPLOYER_PRIVATE_KEY \
 *     --broadcast
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("  Helix Protocol - X Layer Testnet Deploy ");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. AgentRegistry
        AgentRegistry registry = new AgentRegistry();
        console.log("[1/5] AgentRegistry:", address(registry));

        // 2. Reputation
        Reputation reputation = new Reputation();
        console.log("[2/5] Reputation:", address(reputation));

        // 3. Escrow — wired to Reputation
        Escrow escrow = new Escrow(address(reputation));
        console.log("[3/5] Escrow:", address(escrow));

        // 4. Link Reputation updater -> Escrow
        reputation.setUpdater(address(escrow));
        console.log("      Reputation.setUpdater -> Escrow wired");

        // 5. Treasury
        Treasury treasury = new Treasury();
        console.log("[4/5] Treasury:", address(treasury));

        // 6. Settlement — 50 bps (0.5%) coordinator fee
        Settlement settlement = new Settlement(address(treasury), 50);
        console.log("[5/5] Settlement:", address(settlement));

        // Register 3 mock specialist agents
        registry.registerAgent("stargate-bridge-agent", 0xdEF0000000000000000000000000000000000001, "https://agents.helix.finance/stargate");
        registry.registerAgent("curve-yield-agent",     0xDEF0000000000000000000000000000000000002, "https://agents.helix.finance/curve");
        registry.registerAgent("celer-bridge-agent",    0xdEf0000000000000000000000000000000000003, "https://agents.helix.finance/celer");
        console.log("      3 specialist agents registered");

        // 7. IntentStorage
        IntentStorage intentStorage = new IntentStorage();
        console.log("[6/6] IntentStorage:", address(intentStorage));

        vm.stopBroadcast();

        // Write deployed addresses to JSON (picked up by blockchainService.ts)
        string memory json = string(abi.encodePacked(
            '{"agentRegistry":"', vm.toString(address(registry)),
            '","reputation":"',   vm.toString(address(reputation)),
            '","escrow":"',       vm.toString(address(escrow)),
            '","treasury":"',     vm.toString(address(treasury)),
            '","settlement":"',   vm.toString(address(settlement)),
            '","intentStorage":"', vm.toString(address(intentStorage)),
            '"}'
        ));
        vm.writeFile("script/deployed-addresses.json", json);

        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("AgentRegistry:", address(registry));
        console.log("Reputation:   ", address(reputation));
        console.log("Escrow:       ", address(escrow));
        console.log("Treasury:     ", address(treasury));
        console.log("Settlement:   ", address(settlement));
        console.log("IntentStorage:", address(intentStorage));
        console.log("Addresses -> script/deployed-addresses.json");
    }
}
