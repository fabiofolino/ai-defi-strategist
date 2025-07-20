# StrategyRouter Integration Guide

## Overview

The StrategyRouter smart contract has been successfully implemented as Phase 2 of the AI DeFi Strategist project. This document outlines how the smart contract integrates with the existing AI-powered recommendation system.

## Architecture Integration

### Phase 1 (Existing): AI Strategy Recommendations
- **Service**: AI-powered analysis of DeFi opportunities
- **Output**: Strategy recommendations including Lido staking allocations
- **Format**: Text-based strategies with percentage allocations

### Phase 2 (New): Smart Contract Execution
- **Service**: On-chain execution of Lido staking strategies  
- **Input**: ETH deposits from users
- **Output**: Automated staking through Lido with fee collection

## Integration Flow

```
User Input → AI Analysis → Strategy Recommendation → Smart Contract Execution
    ↓              ↓               ↓                      ↓
Portfolio      Market Data    "50% Lido Staking"     StrategyRouter.deposit()
Profile        DeFi APYs      Recommendation         → stETH → wstETH
```

## Example User Journey

1. **Strategy Generation** (Existing System):
   ```bash
   npm start -- --balance 50000 --risk moderate --time "1 year"
   ```
   
   **AI Output**: 
   - "Lido Staking: 50% ($25,000)"
   - Expected yield: 4.50% APY

2. **Strategy Execution** (New Smart Contract):
   ```solidity
   // User deposits 25 ETH for Lido staking portion
   strategyRouter.deposit{value: 25 ether}();
   
   // Contract automatically:
   // - Takes 1% fee (0.25 ETH)
   // - Stakes 24.75 ETH in Lido
   // - Wraps to wstETH for user
   ```

3. **Balance Tracking**:
   ```solidity
   // Check user's position
   (uint256 ethDeposited, uint256 wstETHBalance, uint256 timestamp) = 
       strategyRouter.getUserDeposit(userAddress);
   
   // Get current ETH value
   uint256 currentValue = strategyRouter.getUserETHValue(userAddress);
   ```

## Contract Deployment

### Mainnet Configuration
```javascript
// Deploy with actual Lido contract addresses
const stETHAddress = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const wstETHAddress = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";

const StrategyRouter = await ethers.getContractFactory("StrategyRouter");
const strategyRouter = await StrategyRouter.deploy(stETHAddress, wstETHAddress);
```

### Deployment Command
```bash
# Using Hardhat Ignition
npm run deploy -- --network mainnet ignition/modules/StrategyRouter.js

# Or manual deployment
npx hardhat run scripts/deploy.js --network mainnet
```

## Frontend Integration Points

### 1. Strategy Display Enhancement
Update the existing strategy display to include execution buttons:

```javascript
// Enhanced strategy recommendation display
const strategyDisplay = {
  recommendation: "Lido Staking: 50% ($25,000)",
  executionButton: {
    text: "Execute Lido Staking",
    action: () => executeStaking(25), // 25 ETH
    contract: strategyRouterAddress
  }
};
```

### 2. Contract Interaction
```javascript
// Web3 integration example
import { ethers } from 'ethers';

async function executeStaking(ethAmount) {
  const signer = await window.ethereum.getSigner();
  const contract = new ethers.Contract(strategyRouterAddress, abi, signer);
  
  // Preview the deposit
  const preview = await contract.previewDeposit(ethers.parseEther(ethAmount.toString()));
  console.log(`Fee: ${ethers.formatEther(preview.feeAmount)} ETH`);
  console.log(`wstETH to receive: ${ethers.formatEther(preview.wstETHAmount)}`);
  
  // Execute deposit
  const tx = await contract.deposit({ value: ethers.parseEther(ethAmount.toString()) });
  await tx.wait();
  
  console.log("Staking executed successfully!");
}
```

### 3. Portfolio Tracking
```javascript
async function updatePortfolio(userAddress) {
  const userDeposit = await contract.getUserDeposit(userAddress);
  const currentValue = await contract.getUserETHValue(userAddress);
  
  return {
    totalDeposited: ethers.formatEther(userDeposit.ethDeposited),
    currentBalance: ethers.formatEther(userDeposit.wstETHBalance),
    currentValue: ethers.formatEther(currentValue),
    performance: calculatePerformance(userDeposit.ethDeposited, currentValue)
  };
}
```

## Enhanced AI Recommendations

The AI system can now include execution context in recommendations:

```javascript
// Enhanced strategy service
class AIStrategyService {
  async generateStrategy(userProfile, opportunities) {
    const strategy = await this.getBaseStrategy(userProfile, opportunities);
    
    // Add execution information for Lido allocations
    if (strategy.includes("Lido")) {
      strategy.executionOptions = {
        lidoStaking: {
          contractAddress: process.env.STRATEGY_ROUTER_ADDRESS,
          function: "deposit",
          feeRate: "1%",
          minimumDeposit: "0.01 ETH"
        }
      };
    }
    
    return strategy;
  }
}
```

## Monitoring and Analytics

### Contract Events
Monitor contract events for analytics:

```javascript
// Event monitoring setup
contract.on("Deposit", (user, ethAmount, wstETHReceived, feeAmount, timestamp) => {
  console.log(`New deposit: ${ethers.formatEther(ethAmount)} ETH from ${user}`);
  updateAnalytics({
    type: "deposit",
    user,
    amount: ethAmount,
    fee: feeAmount,
    timestamp
  });
});

contract.on("Withdrawal", (user, wstETHAmount, ethReceived, timestamp) => {
  console.log(`Withdrawal: ${ethers.formatEther(wstETHAmount)} wstETH by ${user}`);
  updateAnalytics({
    type: "withdrawal",
    user,
    amount: wstETHAmount,
    timestamp
  });
});
```

### Performance Tracking
```javascript
async function trackPerformance() {
  const stats = await contract.getContractStats();
  
  return {
    totalValueLocked: ethers.formatEther(stats.totalDeposited),
    totalFeesCollected: ethers.formatEther(stats.totalFees),
    activeUsers: await getActiveUserCount(),
    averageDeposit: calculateAverageDeposit(stats)
  };
}
```

## Testing Strategy

### Unit Tests
- Contract functionality validation ✅
- Fee calculation accuracy ✅  
- User balance tracking ✅
- Withdrawal mechanisms ✅

### Integration Tests
- Lido contract integration (requires mainnet fork)
- Frontend integration testing
- End-to-end user journey testing

### Security Audits
- Reentrancy protection verification
- Access control testing
- Edge case handling
- Gas optimization review

## Deployment Checklist

- [ ] Deploy StrategyRouter to mainnet
- [ ] Verify contract on Etherscan
- [ ] Update frontend with contract address
- [ ] Add contract ABI to frontend
- [ ] Test with small amounts first
- [ ] Update documentation with contract address
- [ ] Set up monitoring and alerts
- [ ] Configure fee withdrawal schedule

## Future Enhancements

1. **Multi-Strategy Support**: Extend contract to support Aave and other protocols
2. **Automated Rebalancing**: Add functions to rebalance based on AI recommendations  
3. **Governance Integration**: Add DAO governance for fee adjustments
4. **Layer 2 Deployment**: Deploy to Arbitrum/Polygon for lower fees
5. **Yield Optimization**: Implement strategies to maximize wstETH yields

## Security Considerations

- **Admin Key Management**: Use multisig for contract ownership
- **Upgrade Path**: Consider proxy pattern for future upgrades
- **Emergency Procedures**: Document emergency pause mechanisms
- **Insurance**: Consider protocol insurance for user funds
- **Regular Audits**: Schedule periodic security reviews

---

*This integration guide provides the foundation for combining AI-powered DeFi strategy generation with on-chain execution capabilities, creating a complete end-to-end solution for users.*