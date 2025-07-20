import dotenv from 'dotenv';
import { DeFiDataService } from './services/defiDataService.js';
import { AIStrategyService } from './services/aiStrategyService.js';
import { validateUserProfile, parseCliArgs, displayHelp, formatBalance, formatAPY } from './utils/helpers.js';

// Load environment variables
dotenv.config();

/**
 * Main AI DeFi Strategy Agent
 */
class DeFiStrategyAgent {
  constructor() {
    this.defiService = new DeFiDataService(process.env.INFURA_API_KEY);
    this.aiService = new AIStrategyService(process.env.OPENAI_API_KEY);
  }

  /**
   * Generate strategy recommendation for a user
   */
  async generateRecommendation(userProfile) {
    console.log('🔍 Analyzing DeFi opportunities...\n');
    
    try {
      // Fetch current DeFi data
      const opportunities = await this.defiService.getAllOpportunities();
      
      // Display current opportunities
      this.displayOpportunities(opportunities);
      
      // Generate AI strategy
      console.log('🤖 Generating personalized strategy...\n');
      const recommendation = await this.aiService.generateStrategy(userProfile, opportunities);
      
      return recommendation;
    } catch (error) {
      console.error('Error generating recommendation:', error.message);
      throw error;
    }
  }

  /**
   * Display current DeFi opportunities
   */
  displayOpportunities(opportunities) {
    console.log('📊 Current DeFi Opportunities:');
    console.log('─'.repeat(50));
    
    // Lido
    console.log(`🟢 ${opportunities.lido.protocol}:`);
    console.log(`   APY: ${formatAPY(opportunities.lido.apy)}`);
    console.log(`   Risk: ${opportunities.lido.risk}`);
    console.log(`   Description: ${opportunities.lido.description}\n`);
    
    // Aave
    console.log(`🔵 Aave Lending:`);
    opportunities.aave.forEach(item => {
      console.log(`   ${item.token}: ${formatAPY(item.supplyAPY)} supply APY (${item.risk})`);
    });
    console.log('');
  }

  /**
   * Display strategy recommendation
   */
  displayRecommendation(recommendation) {
    console.log('💡 AI Strategy Recommendation:');
    console.log('═'.repeat(60));
    console.log(`User Balance: ${formatBalance(recommendation.userProfile.walletBalance)}`);
    console.log(`Risk Tolerance: ${recommendation.userProfile.riskTolerance}`);
    console.log(`Time Horizon: ${recommendation.userProfile.timeHorizon}`);
    console.log(`Strategy Confidence: ${recommendation.confidence.toUpperCase()}`);
    if (recommendation.fallback) {
      console.log('⚠️  Using fallback strategy (OpenAI API unavailable)');
    }
    console.log('');
    console.log(recommendation.strategy);
    console.log('');
    console.log('─'.repeat(60));
    console.log(`Generated at: ${new Date(recommendation.timestamp).toLocaleString()}`);
  }
}

/**
 * CLI Interface
 */
async function runCLI() {
  const args = process.argv.slice(2);
  
  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
    return;
  }
  
  // Parse user inputs
  const userProfile = parseCliArgs(args);
  
  // Validate inputs
  const validation = validateUserProfile(userProfile);
  if (!validation.isValid) {
    console.error('❌ Invalid inputs:');
    validation.errors.forEach(error => console.error(`   • ${error}`));
    console.log('\nUse --help for usage information.');
    process.exit(1);
  }
  
  console.log('🚀 AI DeFi Strategist Starting...\n');
  
  // Check API keys
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OpenAI API key not found. Will use fallback strategy.');
  }
  if (!process.env.INFURA_API_KEY) {
    console.warn('⚠️  Infura API key not found. Will use fallback data.');
  }
  console.log('');
  
  try {
    const agent = new DeFiStrategyAgent();
    const recommendation = await agent.generateRecommendation(userProfile);
    agent.displayRecommendation(recommendation);
  } catch (error) {
    console.error('❌ Failed to generate strategy:', error.message);
    process.exit(1);
  }
}

/**
 * Example usage function for demonstration
 */
async function runExample() {
  console.log('🎯 Running AI DeFi Strategist Example\n');
  
  const exampleProfile = {
    walletBalance: 50000,
    riskTolerance: 'moderate',
    timeHorizon: '1 year',
    preferredAssets: ['ETH', 'USDC']
  };
  
  const agent = new DeFiStrategyAgent();
  const recommendation = await agent.generateRecommendation(exampleProfile);
  agent.displayRecommendation(recommendation);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const hasArgs = process.argv.length > 2;
  
  if (hasArgs) {
    runCLI().catch(console.error);
  } else {
    console.log('No arguments provided. Running example...\n');
    runExample().catch(console.error);
  }
}

export { DeFiStrategyAgent };