# StrategyRouter Smart Contract

## Overview

The StrategyRouter smart contract is a Phase 2 implementation that enables users to deposit ETH and automatically stake it through Lido's liquid staking protocol. The contract provides a streamlined interface for ETH staking while implementing a platform fee mechanism.

## Key Features

### 1. ETH Deposits
- Accepts ETH deposits from users (minimum 0.01 ETH)
- Automatically stakes deposited ETH through Lido to receive stETH
- Wraps stETH to wstETH for better yield optimization
- Tracks individual user deposits and balances

### 2. Platform Fee Structure
- Takes a 1% platform fee from each deposit
- Fee is calculated before staking (not on rewards)
- Fees are collected in ETH and can be withdrawn by contract owner

### 3. User Balance Tracking
- Maintains detailed records of each user's deposits
- Tracks total ETH deposited and current wstETH balance
- Provides real-time ETH value calculations

### 4. Withdrawal Options
- **Direct wstETH Withdrawal**: Users can withdraw their wstETH tokens directly
- **Convert to stETH**: Users can unwrap wstETH to stETH before withdrawal
- Maintains user balance integrity during withdrawals

## Contract Architecture

### Core Components

1. **Lido Integration**
   - Interfaces with Lido's stETH contract for staking
   - Uses wstETH wrapper for yield-bearing token management
   - Handles ETH → stETH → wstETH conversion flow

2. **User Management**
   - `UserDeposit` struct tracks per-user data
   - Mapping of user addresses to deposit information
   - Timestamp tracking for audit purposes

3. **Fee Management**
   - 1% fee (100 basis points) on deposits
   - Owner-only fee withdrawal function
   - Transparent fee calculation and tracking

### Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks on deposit/withdrawal functions
- **Ownable**: Access control for administrative functions
- **Input Validation**: Minimum deposit requirements and balance checks
- **Emergency Recovery**: Token recovery function for accidentally sent tokens

## Usage Examples

### For Users

```solidity
// Deposit 1 ETH
strategyRouter.deposit{value: 1 ether}();

// Check balance
(uint256 ethDeposited, uint256 wstETHBalance, uint256 timestamp) = 
    strategyRouter.getUserDeposit(userAddress);

// Withdraw 0.5 wstETH
strategyRouter.withdraw(0.5 ether);

// Preview deposit before executing
(uint256 wstETHAmount, uint256 feeAmount) = 
    strategyRouter.previewDeposit(1 ether);
```

### For Contract Owner

```solidity
// Withdraw collected fees
strategyRouter.withdrawFees();

// Emergency token recovery (if needed)
strategyRouter.emergencyTokenRecovery(tokenAddress, amount);
```

## Deployment Configuration

### Mainnet Addresses
- **stETH**: `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84`
- **wstETH**: `0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0`

### Deployment Script
```javascript
const stETHAddress = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const wstETHAddress = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";
const strategyRouter = await StrategyRouter.deploy(stETHAddress, wstETHAddress);
```

## Integration with AI Strategy System

The StrategyRouter contract serves as the execution layer for the AI-powered strategy recommendations:

1. **AI Analysis**: The existing AI system analyzes user profiles and market conditions
2. **Strategy Generation**: AI recommends optimal allocation including Lido staking
3. **Execution**: Users can execute Lido staking strategies through StrategyRouter
4. **Monitoring**: The system can track performance through contract view functions

## Testing

The contract includes comprehensive test coverage:

- Deployment verification
- Deposit functionality and fee calculation
- Withdrawal mechanisms
- Owner permissions and fee management
- View function accuracy
- Edge cases and error conditions

## Events

The contract emits the following events for frontend integration and monitoring:

- `Deposit(user, ethAmount, wstETHReceived, feeAmount, timestamp)`
- `Withdrawal(user, wstETHAmount, ethReceived, timestamp)`
- `FeesWithdrawn(owner, amount, timestamp)`

## Gas Optimization

- Uses `immutable` for contract addresses
- Efficient storage layout with packed structs
- Batch operations where possible
- Minimal external calls per transaction

## Risk Considerations

1. **Smart Contract Risk**: Dependency on Lido protocol security
2. **Staking Risk**: ETH 2.0 validator risks inherent to Lido
3. **Liquidity Risk**: wstETH/stETH may have temporary liquidity constraints
4. **Admin Risk**: Owner controls fee withdrawal (consider timelock for production)

## Future Enhancements

- Multi-strategy support
- Automated rebalancing
- Governance token integration
- Cross-chain deployment
- Advanced fee structures

## Version Information

- **Contract Version**: 1.0.0
- **Solidity Version**: ^0.8.20
- **OpenZeppelin Version**: Latest stable
- **Hardhat Version**: 2.26.0