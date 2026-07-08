// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    address public owner;

    struct Agent {
        string id;
        address walletAddress;
        string endpoint;
        bool active;
        bool exists;
    }

    mapping(string => Agent) private agents;
    string[] private agentIds;

    event AgentRegistered(string indexed id, address indexed walletAddress, string endpoint);
    event AgentUpdated(string indexed id, address indexed walletAddress, bool active);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerAgent(
        string calldata id,
        address walletAddress,
        string calldata endpoint
    ) external onlyOwner {
        require(walletAddress != address(0), "Invalid address");
        require(!agents[id].exists, "Agent already exists");

        agents[id] = Agent({
            id: id,
            walletAddress: walletAddress,
            endpoint: endpoint,
            active: true,
            exists: true
        });
        agentIds.push(id);

        emit AgentRegistered(id, walletAddress, endpoint);
    }

    function updateAgent(
        string calldata id,
        address walletAddress,
        string calldata endpoint,
        bool active
    ) external onlyOwner {
        require(agents[id].exists, "Agent does not exist");
        require(walletAddress != address(0), "Invalid address");

        agents[id].walletAddress = walletAddress;
        agents[id].endpoint = endpoint;
        agents[id].active = active;

        emit AgentUpdated(id, walletAddress, active);
    }

    function getAgent(string calldata id) external view returns (
        string memory agentId,
        address walletAddress,
        string memory endpoint,
        bool active,
        bool exists
    ) {
        Agent memory agent = agents[id];
        return (agent.id, agent.walletAddress, agent.endpoint, agent.active, agent.exists);
    }

    function getAgentCount() external view returns (uint256) {
        return agentIds.length;
    }

    function getAgentIdAt(uint256 index) external view returns (string memory) {
        require(index < agentIds.length, "Index out of bounds");
        return agentIds[index];
    }
}
