// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Settlement {
    address public owner;
    address public treasury;
    uint256 public feePercentageBps; // 1 basis point = 0.01% (e.g. 50 bps = 0.5%)

    event FeesSettled(
        bytes32 indexed taskId,
        address indexed agentWallet,
        uint256 totalAmount,
        uint256 agentAmount,
        uint256 platformFee
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor(address _treasury, uint256 _feePercentageBps) {
        owner = msg.sender;
        treasury = _treasury;
        feePercentageBps = _feePercentageBps;
    }

    function setFeePercentageBps(uint256 _feePercentageBps) external onlyOwner {
        require(_feePercentageBps <= 500, "Fee cap at 5%");
        feePercentageBps = _feePercentageBps;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    // Accepts funds and settles them between the executing agent and the platform treasury
    function settlePayment(
        bytes32 taskId,
        address payable agentWallet
    ) external payable onlyOwner {
        require(msg.value > 0, "No value to settle");
        require(agentWallet != address(0), "Invalid agent wallet");

        uint256 platformFee = (msg.value * feePercentageBps) / 10000;
        uint256 agentAmount = msg.value - platformFee;

        // Route treasury fee
        if (platformFee > 0) {
            payable(treasury).transfer(platformFee);
        }

        // Route agent reward
        agentWallet.transfer(agentAmount);

        emit FeesSettled(taskId, agentWallet, msg.value, agentAmount, platformFee);
    }
}
