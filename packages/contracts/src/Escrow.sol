// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Reputation.sol";

contract Escrow {
    address public owner;
    Reputation public reputationContract;

    struct EscrowItem {
        address depositor;
        string agentId;
        uint256 amount;
        uint256 lockTime;
        uint256 timeout;
        bool released;
        bool refunded;
        bool exists;
    }

    mapping(bytes32 => EscrowItem) public escrows;

    event EscrowCreated(bytes32 indexed taskId, address indexed depositor, string agentId, uint256 amount, uint256 timeout);
    event EscrowReleased(bytes32 indexed taskId, string agentId, uint256 amount);
    event EscrowRefunded(bytes32 indexed taskId, address indexed depositor, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor(address _reputationContract) {
        owner = msg.sender;
        reputationContract = Reputation(_reputationContract);
    }

    function createEscrow(
        bytes32 taskId,
        string calldata agentId,
        uint256 timeoutSeconds
    ) external payable {
        require(msg.value > 0, "Must lock non-zero amount");
        require(!escrows[taskId].exists, "Escrow for taskId already exists");

        escrows[taskId] = EscrowItem({
            depositor: msg.sender,
            agentId: agentId,
            amount: msg.value,
            lockTime: block.timestamp,
            timeout: timeoutSeconds,
            released: false,
            refunded: false,
            exists: true
        });

        emit EscrowCreated(taskId, msg.sender, agentId, msg.value, timeoutSeconds);
    }

    function releaseEscrow(bytes32 taskId) external onlyOwner {
        EscrowItem storage item = escrows[taskId];
        require(item.exists, "Escrow does not exist");
        require(!item.released, "Already released");
        require(!item.refunded, "Already refunded");

        item.released = true;

        // Perform reputation update
        reputationContract.recordExecution(item.agentId, true, item.amount / 1e15); // scaled volume

        emit EscrowReleased(taskId, item.agentId, item.amount);

        // For MVP, owner forwards funds to the settlement system, or directly to target agent/treasury
        // For simplicity: transfer directly to the owner/coordinator wallet which handles payouts offchain, or can be extended
        payable(owner).transfer(item.amount);
    }

    function refundEscrow(bytes32 taskId) external {
        EscrowItem storage item = escrows[taskId];
        require(item.exists, "Escrow does not exist");
        require(!item.released, "Already released");
        require(!item.refunded, "Already refunded");
        require(
            msg.sender == owner || 
            (block.timestamp > item.lockTime + item.timeout),
            "Cannot refund yet or not authorized"
        );

        item.refunded = true;

        // Perform reputation update marking failure
        reputationContract.recordExecution(item.agentId, false, 0);

        emit EscrowRefunded(taskId, item.depositor, item.amount);

        payable(item.depositor).transfer(item.amount);
    }
}
