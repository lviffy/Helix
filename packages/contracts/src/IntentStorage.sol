// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IntentStorage {
    address public owner;

    struct IntentRecord {
        address userWallet;
        bytes32 intentHash; // keccak256 hash of intent content
        string status;      // active, completed, failed
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => IntentRecord) private intents;
    bytes32[] private intentIds;

    event IntentRecorded(bytes32 indexed intentId, address indexed userWallet, bytes32 intentHash, string status);
    event IntentStatusUpdated(bytes32 indexed intentId, string newStatus);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function recordIntent(
        bytes32 intentId,
        address userWallet,
        bytes32 intentHash,
        string calldata status
    ) external onlyOwner {
        require(!intents[intentId].exists, "Intent already exists");

        intents[intentId] = IntentRecord({
            userWallet: userWallet,
            intentHash: intentHash,
            status: status,
            timestamp: block.timestamp,
            exists: true
        });
        intentIds.push(intentId);

        emit IntentRecorded(intentId, userWallet, intentHash, status);
    }

    function updateIntentStatus(bytes32 intentId, string calldata newStatus) external onlyOwner {
        require(intents[intentId].exists, "Intent does not exist");
        intents[intentId].status = newStatus;

        emit IntentStatusUpdated(intentId, newStatus);
    }

    function getIntent(bytes32 intentId) external view returns (
        address userWallet,
        bytes32 intentHash,
        string memory status,
        uint256 timestamp,
        bool exists
    ) {
        IntentRecord memory record = intents[intentId];
        return (record.userWallet, record.intentHash, record.status, record.timestamp, record.exists);
    }
}
