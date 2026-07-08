// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Reputation {
    address public owner;
    address public updater; // e.g., Escrow / Settlement contract

    struct ReputationInfo {
        uint256 score;         // out of 10000 (e.g. 9200 = 92%)
        uint256 totalTasks;
        uint256 successfulTasks;
        uint256 totalVolumeUsd; // in wei-like units or simple integer
    }

    mapping(string => ReputationInfo) private agentReputations;

    event ReputationUpdated(string indexed agentId, uint256 newScore, uint256 totalTasks, uint256 successfulTasks);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == updater, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setUpdater(address _updater) external onlyOwner {
        updater = _updater;
    }

    function recordExecution(
        string calldata agentId,
        bool success,
        uint256 taskVolumeUsd
    ) external onlyAuthorized {
        ReputationInfo storage info = agentReputations[agentId];
        
        info.totalTasks += 1;
        if (success) {
            info.successfulTasks += 1;
        }

        // Reputation score formula: success rate * 10000.
        // Also add small weight or base reputation of 9000 for new agents.
        if (info.totalTasks > 0) {
            info.score = (info.successfulTasks * 10000) / info.totalTasks;
        }

        info.totalVolumeUsd += taskVolumeUsd;

        emit ReputationUpdated(agentId, info.score, info.totalTasks, info.successfulTasks);
    }

    function getReputation(string calldata agentId) external view returns (
        uint256 score,
        uint256 totalTasks,
        uint256 successfulTasks,
        uint256 totalVolumeUsd
    ) {
        ReputationInfo memory info = agentReputations[agentId];
        // If agent has no tasks yet, default to 90.00% (9000)
        uint256 currentScore = info.totalTasks == 0 ? 9000 : info.score;
        return (currentScore, info.totalTasks, info.successfulTasks, info.totalVolumeUsd);
    }
}
