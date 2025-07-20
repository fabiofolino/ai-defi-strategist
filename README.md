# AI DeFi Strategist

A decentralized application that leverages AI to recommend and deploy custom yield strategies using Ethereum-based protocols.

## Features

- **AI-Powered Strategy Generation**: Uses OpenAI GPT-4 to analyze user profiles and generate personalized DeFi strategies
- **Real-time DeFi Data**: Fetches current APYs from Lido (ETH staking) and Aave (lending protocols)
- **Risk Assessment**: Provides risk analysis based on user tolerance and market conditions
- **CLI Interface**: Easy-to-use command line interface for quick strategy generation

## Supported Protocols

- **Lido**: Ethereum 2.0 staking with liquid staking tokens
- **Aave**: Decentralized lending protocol with variable APYs

## Prerequisites

- Node.js 18+ 
- OpenAI API key (optional - fallback strategy available)
- Infura API key (optional - fallback data available)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/fabiofolino/ai-defi-strategist.git
cd ai-defi-strategist
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

## Usage

### CLI Usage

Run with specific parameters:
```bash
npm start -- --balance 10000 --risk moderate --time "1 year" --assets "ETH,USDC"
```

### Parameters

- `--balance <amount>`: Your wallet balance in USD (required)
- `--risk <level>`: Risk tolerance: `conservative`, `moderate`, or `aggressive` (required)
- `--time <horizon>`: Investment time horizon, e.g., "6 months", "1 year" (required)
- `--assets <list>`: Preferred assets, comma-separated (optional)
- `--help`: Show help information

### Example Usage

```bash
# Conservative strategy for $50k over 6 months
npm start -- --balance 50000 --risk conservative --time "6 months"

# Aggressive strategy with ETH preference
npm start -- --balance 25000 --risk aggressive --time "2 years" --assets "ETH"

# Run example without parameters
npm start
```

## Example Output

```
🚀 AI DeFi Strategist Starting...

🔍 Analyzing DeFi opportunities...

📊 Current DeFi Opportunities:
──────────────────────────────────────────────────
🟢 Lido:
   APY: 4.50%
   Risk: Medium
   Description: Ethereum 2.0 staking rewards

🔵 Aave Lending:
   USDC: 3.20% supply APY (Low-Medium)
   WETH: 2.80% supply APY (Low-Medium)

🤖 Generating personalized strategy...

💡 AI Strategy Recommendation:
════════════════════════════════════════════════════════════
User Balance: $50,000.00
Risk Tolerance: moderate
Time Horizon: 1 year
Strategy Confidence: HIGH

**Recommended Allocation Strategy**

1. **Allocation Breakdown:**
   - Lido ETH Staking: 50% ($25,000)
   - Aave USDC Lending: 30% ($15,000)
   - Aave WETH Lending: 20% ($10,000)

2. **Risk Assessment:**
   - Overall Portfolio Risk: MEDIUM
   - Diversification across liquid staking and lending
   - No single protocol exposure >50%

3. **Expected Returns:**
   - Estimated Annual Yield: 4.2-5.8%
   - Conservative estimate: $2,100-$2,900 annually

4. **Implementation Steps:**
   1. Convert $15,000 to USDC for Aave supply
   2. Stake $25,000 ETH through Lido (receive stETH)
   3. Supply $10,000 worth of WETH to Aave
   4. Monitor weekly for rate changes

5. **Exit Strategy:**
   - Lido: Can sell stETH anytime (consider slippage)
   - Aave: Instant withdrawal of supplied assets
   - Rebalance quarterly based on APY changes

**Risk Considerations:**
- Smart contract risk across protocols
- ETH price volatility affects 70% of portfolio
- Interest rate fluctuation risk

────────────────────────────────────────────────────────────
Generated at: 7/20/2024, 4:17:23 PM
```

## Project Structure

```
src/
├── index.js                 # Main application entry point
├── services/
│   ├── defiDataService.js   # DeFi protocol data fetching
│   └── aiStrategyService.js # OpenAI integration for strategy generation
└── utils/
    └── helpers.js           # Utility functions and validation
```

## Environment Variables

Create a `.env` file with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
INFURA_API_KEY=your_infura_api_key_here
```

## API Dependencies

- **OpenAI API**: For AI-powered strategy generation
- **Lido API**: For current staking APY data
- **Aave API**: For lending protocol rates
- **Infura**: For Ethereum network connectivity

## Fallback Behavior

The application includes robust fallback mechanisms:

- **No OpenAI API Key**: Uses rule-based strategy generation
- **No Infura API Key**: Uses cached/estimated DeFi data
- **API Failures**: Graceful degradation with reasonable estimates

## Development

```bash
# Run in development mode with file watching
npm run dev

# Run example
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Disclaimer

This tool provides educational information only and should not be considered financial advice. Always do your own research and consider consulting with financial professionals before making investment decisions. DeFi protocols carry inherent risks including smart contract vulnerabilities, impermanent loss, and market volatility.
