// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ILido.sol";

/**
 * @title StrategyRouter
 * @dev A smart contract that accepts ETH from users, stakes it in Lido (via wstETH),
 *      tracks deposit amounts and user balances, and takes a 1% platform fee.
 */
contract StrategyRouter is ReentrancyGuard, Ownable {
    // Lido contract addresses on Ethereum mainnet
    IStETH public immutable stETH;
    IWstETH public immutable wstETH;
    
    // Platform fee in basis points (100 = 1%)
    uint256 public constant PLATFORM_FEE_BPS = 100;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Minimum deposit amount (0.01 ETH)
    uint256 public constant MIN_DEPOSIT = 0.01 ether;
    
    // User deposit tracking
    struct UserDeposit {
        uint256 ethDeposited;    // Total ETH deposited by user
        uint256 wstETHBalance;   // wstETH balance owned by user
        uint256 timestamp;       // Last deposit timestamp
    }
    
    mapping(address => UserDeposit) public userDeposits;
    
    // Contract state
    uint256 public totalETHDeposited;
    uint256 public totalFeesCollected;
    uint256 public totalWstETHHeld;
    
    // Events
    event Deposit(
        address indexed user,
        uint256 ethAmount,
        uint256 wstETHReceived,
        uint256 feeAmount,
        uint256 timestamp
    );
    
    event Withdrawal(
        address indexed user,
        uint256 wstETHAmount,
        uint256 ethReceived,
        uint256 timestamp
    );
    
    event FeesWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Constructor
     * @param _stETH Address of the Lido stETH contract
     * @param _wstETH Address of the Lido wstETH contract
     */
    constructor(address _stETH, address _wstETH) Ownable(msg.sender) {
        require(_stETH != address(0), "Invalid stETH address");
        require(_wstETH != address(0), "Invalid wstETH address");
        
        stETH = IStETH(_stETH);
        wstETH = IWstETH(_wstETH);
        
        // Approve wstETH to spend stETH for wrapping
        stETH.approve(_wstETH, type(uint256).max);
    }

    /**
     * @dev Deposit ETH and stake it in Lido
     * @notice User sends ETH, contract stakes it via Lido, wraps to wstETH, takes 1% fee
     */
    function deposit() external payable nonReentrant {
        require(msg.value >= MIN_DEPOSIT, "Deposit below minimum");
        
        uint256 ethAmount = msg.value;
        
        // Calculate platform fee (1%)
        uint256 feeAmount = (ethAmount * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 stakingAmount = ethAmount - feeAmount;
        
        // Stake ETH with Lido to get stETH
        uint256 stETHReceived = stETH.submit{value: stakingAmount}(address(0));
        
        // Wrap stETH to wstETH
        uint256 wstETHReceived = wstETH.wrap(stETHReceived);
        
        // Update user deposit record
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        userDeposit.ethDeposited += ethAmount;
        userDeposit.wstETHBalance += wstETHReceived;
        userDeposit.timestamp = block.timestamp;
        
        // Update contract state
        totalETHDeposited += ethAmount;
        totalFeesCollected += feeAmount;
        totalWstETHHeld += wstETHReceived;
        
        emit Deposit(msg.sender, ethAmount, wstETHReceived, feeAmount, block.timestamp);
    }

    /**
     * @dev Withdraw wstETH tokens
     * @param wstETHAmount Amount of wstETH to withdraw
     */
    function withdraw(uint256 wstETHAmount) external nonReentrant {
        require(wstETHAmount > 0, "Amount must be greater than 0");
        
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        require(userDeposit.wstETHBalance >= wstETHAmount, "Insufficient balance");
        
        // Update user balance
        userDeposit.wstETHBalance -= wstETHAmount;
        totalWstETHHeld -= wstETHAmount;
        
        // Transfer wstETH to user
        require(wstETH.transfer(msg.sender, wstETHAmount), "Transfer failed");
        
        emit Withdrawal(msg.sender, wstETHAmount, 0, block.timestamp);
    }

    /**
     * @dev Withdraw and unwrap wstETH to stETH, then to ETH
     * @param wstETHAmount Amount of wstETH to withdraw and convert to ETH
     */
    function withdrawAsETH(uint256 wstETHAmount) external nonReentrant {
        require(wstETHAmount > 0, "Amount must be greater than 0");
        
        UserDeposit storage userDeposit = userDeposits[msg.sender];
        require(userDeposit.wstETHBalance >= wstETHAmount, "Insufficient balance");
        
        // Update user balance
        userDeposit.wstETHBalance -= wstETHAmount;
        totalWstETHHeld -= wstETHAmount;
        
        // Unwrap wstETH to stETH
        uint256 stETHReceived = wstETH.unwrap(wstETHAmount);
        
        // Transfer stETH to user (Note: Direct ETH withdrawal from stETH is complex 
        // and may require additional mechanisms not available in basic interface)
        require(stETH.transfer(msg.sender, stETHReceived), "Transfer failed");
        
        emit Withdrawal(msg.sender, wstETHAmount, stETHReceived, block.timestamp);
    }

    /**
     * @dev Owner withdraws collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 feeAmount = totalFeesCollected;
        require(feeAmount > 0, "No fees to withdraw");
        
        totalFeesCollected = 0;
        
        (bool success, ) = payable(owner()).call{value: feeAmount}("");
        require(success, "Fee withdrawal failed");
        
        emit FeesWithdrawn(owner(), feeAmount, block.timestamp);
    }

    // View functions

    /**
     * @dev Get user deposit information
     * @param user Address of the user
     * @return ethDeposited Total ETH deposited by user
     * @return wstETHBalance Current wstETH balance of user
     * @return timestamp Last deposit timestamp
     */
    function getUserDeposit(address user) external view returns (
        uint256 ethDeposited,
        uint256 wstETHBalance,
        uint256 timestamp
    ) {
        UserDeposit memory userDeposit = userDeposits[user];
        return (userDeposit.ethDeposited, userDeposit.wstETHBalance, userDeposit.timestamp);
    }

    /**
     * @dev Get the current ETH value of user's wstETH balance
     * @param user Address of the user
     * @return ethValue Current ETH value of user's wstETH
     */
    function getUserETHValue(address user) external view returns (uint256 ethValue) {
        uint256 userWstETH = userDeposits[user].wstETHBalance;
        if (userWstETH == 0) return 0;
        
        uint256 stETHAmount = wstETH.getStETHByWstETH(userWstETH);
        return stETHAmount; // stETH is approximately 1:1 with ETH
    }

    /**
     * @dev Calculate how much wstETH would be received for a given ETH amount
     * @param ethAmount Amount of ETH to deposit
     * @return wstETHAmount Expected wstETH amount after fees and staking
     * @return feeAmount Platform fee amount
     */
    function previewDeposit(uint256 ethAmount) external view returns (
        uint256 wstETHAmount,
        uint256 feeAmount
    ) {
        require(ethAmount >= MIN_DEPOSIT, "Deposit below minimum");
        
        feeAmount = (ethAmount * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 stakingAmount = ethAmount - feeAmount;
        
        // Estimate wstETH amount (this is approximate)
        wstETHAmount = wstETH.getWstETHByStETH(stakingAmount);
    }

    /**
     * @dev Get contract statistics
     * @return totalDeposited Total ETH deposited
     * @return totalFees Total fees collected
     * @return totalWstETH Total wstETH held by contract
     */
    function getContractStats() external view returns (
        uint256 totalDeposited,
        uint256 totalFees,
        uint256 totalWstETH
    ) {
        return (totalETHDeposited, totalFeesCollected, totalWstETHHeld);
    }

    /**
     * @dev Emergency function to recover any accidentally sent tokens
     * @param token Address of the token to recover
     * @param amount Amount to recover
     */
    function emergencyTokenRecovery(address token, uint256 amount) external onlyOwner {
        require(token != address(wstETH), "Cannot recover wstETH");
        require(IERC20(token).transfer(owner(), amount), "Recovery failed");
    }
}