// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";
import "../src/Reputation.sol";
import "../src/Escrow.sol";
import "../src/Settlement.sol";

contract HelixTest is Test {
    AgentRegistry registry;
    Reputation reputation;
    Escrow escrow;
    Settlement settlement;

    address owner = address(this);
    address alice = address(0x1111);
    address agentWallet = address(0x2222);

    receive() external payable {}

    function setUp() public {
        registry = new AgentRegistry();
        reputation = new Reputation();
        escrow = new Escrow(address(reputation));
        settlement = new Settlement(address(0x3333), 50); // 0.5% fee

        reputation.setUpdater(address(escrow));
    }

    function testRegisterAgent() public {
        registry.registerAgent("stargate", agentWallet, "http://localhost");
        (string memory id, address wallet, , bool active, bool exists) = registry.getAgent("stargate");
        assertEq(id, "stargate");
        assertEq(wallet, agentWallet);
        assertTrue(active);
        assertTrue(exists);
    }

    function testEscrowAndRelease() public {
        vm.deal(alice, 10 ether);
        
        bytes32 taskId = keccak256("task_01");
        
        vm.prank(alice);
        escrow.createEscrow{value: 1 ether}(taskId, "stargate", 3600);
        
        (address depositor, string memory agentId, uint256 amount, , , bool released, bool refunded, ) = escrow.escrows(taskId);
        assertEq(depositor, alice);
        assertEq(agentId, "stargate");
        assertEq(amount, 1 ether);
        assertFalse(released);
        assertFalse(refunded);

        escrow.releaseEscrow(taskId);
        
        (, , , , , released, , ) = escrow.escrows(taskId);
        assertTrue(released);

        // Verify reputation score updated (since stargate completed first task, success = 10000)
        (uint256 score, uint256 total, uint256 successful, ) = reputation.getReputation("stargate");
        assertEq(total, 1);
        assertEq(successful, 1);
        assertEq(score, 10000);
    }
}
