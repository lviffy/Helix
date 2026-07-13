// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Treasury {
    address public owner;
    
    event Deposit(address indexed sender, uint256 amount);
    event Withdrawal(address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Accept native payments directly
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    fallback() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
        emit Withdrawal(owner, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
