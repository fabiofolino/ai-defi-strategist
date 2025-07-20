/**
 * Utility functions for input validation and formatting
 */

/**
 * Validate user profile inputs
 */
export function validateUserProfile(profile) {
  const errors = [];
  
  if (!profile.walletBalance || profile.walletBalance <= 0) {
    errors.push('Wallet balance must be a positive number');
  }
  
  if (!profile.riskTolerance || !['conservative', 'moderate', 'aggressive'].includes(profile.riskTolerance.toLowerCase())) {
    errors.push('Risk tolerance must be one of: conservative, moderate, aggressive');
  }
  
  if (!profile.timeHorizon) {
    errors.push('Time horizon is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Format wallet balance for display
 */
export function formatBalance(balance) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(balance);
}

/**
 * Format APY percentage
 */
export function formatAPY(apy) {
  return `${apy.toFixed(2)}%`;
}

/**
 * Parse command line arguments for CLI interface
 */
export function parseCliArgs(args) {
  const profile = {
    walletBalance: null,
    riskTolerance: null,
    timeHorizon: null,
    preferredAssets: []
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--balance' && i + 1 < args.length) {
      profile.walletBalance = parseFloat(args[i + 1]);
      i++;
    } else if (arg === '--risk' && i + 1 < args.length) {
      profile.riskTolerance = args[i + 1];
      i++;
    } else if (arg === '--time' && i + 1 < args.length) {
      profile.timeHorizon = args[i + 1];
      i++;
    } else if (arg === '--assets' && i + 1 < args.length) {
      profile.preferredAssets = args[i + 1].split(',').map(asset => asset.trim());
      i++;
    }
  }
  
  return profile;
}

/**
 * Display help information for CLI
 */
export function displayHelp() {
  console.log(`
AI DeFi Strategist - CLI Usage:

node src/index.js [options]

Options:
  --balance <amount>    Your wallet balance in USD (required)
  --risk <level>        Risk tolerance: conservative, moderate, or aggressive (required)
  --time <horizon>      Investment time horizon, e.g., "6 months", "1 year" (required)
  --assets <list>       Preferred assets, comma-separated, e.g., "ETH,USDC" (optional)
  --help               Show this help message

Example:
  node src/index.js --balance 10000 --risk moderate --time "1 year" --assets "ETH,USDC"
  `);
}