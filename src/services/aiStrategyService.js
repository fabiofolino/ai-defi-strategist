import OpenAI from 'openai';

/**
 * AI Strategy Service using OpenAI to generate DeFi strategies
 */
export class AIStrategyService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.openai = apiKey ? new OpenAI({ apiKey: apiKey }) : null;
  }

  /**
   * Generate a DeFi strategy based on user inputs and available opportunities
   */
  async generateStrategy(userProfile, defiOpportunities) {
    // If no OpenAI API key is available, use fallback strategy
    if (!this.openai || !this.apiKey) {
      console.log('🔄 Using fallback strategy (OpenAI API not configured)');
      return this.generateFallbackStrategy(userProfile, defiOpportunities);
    }

    const prompt = this.buildPrompt(userProfile, defiOpportunities);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert DeFi strategist. Provide clear, actionable investment strategies based on user profile and current market opportunities. Always include risk assessment and specific allocation recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const strategy = completion.choices[0].message.content;
      return this.parseStrategy(strategy, userProfile, defiOpportunities);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateFallbackStrategy(userProfile, defiOpportunities);
    }
  }

  /**
   * Build the prompt for OpenAI based on user profile and opportunities
   */
  buildPrompt(userProfile, opportunities) {
    return `
User Profile:
- Wallet Balance: $${userProfile.walletBalance}
- Risk Tolerance: ${userProfile.riskTolerance}
- Investment Horizon: ${userProfile.timeHorizon}
- Preferred Assets: ${userProfile.preferredAssets?.join(', ') || 'Any'}

Available DeFi Opportunities:
1. Lido Staking:
   - APY: ${opportunities.lido.apy}%
   - Risk: ${opportunities.lido.risk}
   - Description: ${opportunities.lido.description}

2. Aave Lending:
${opportunities.aave.map(item => 
  `   - ${item.token}: ${item.supplyAPY}% APY (${item.risk} risk)`
).join('\n')}

Please provide:
1. Recommended allocation strategy (specific percentages)
2. Risk assessment for this user
3. Expected returns
4. Step-by-step implementation guide
5. Exit strategy considerations

Format your response clearly with numbered sections.
    `.trim();
  }

  /**
   * Parse and structure the AI-generated strategy
   */
  parseStrategy(strategyText, userProfile, opportunities) {
    return {
      strategy: strategyText,
      userProfile: userProfile,
      opportunities: opportunities,
      timestamp: new Date().toISOString(),
      confidence: 'high',
      riskLevel: this.assessRiskLevel(userProfile, opportunities)
    };
  }

  /**
   * Assess overall risk level of the strategy
   */
  assessRiskLevel(userProfile, opportunities) {
    const riskMapping = {
      'conservative': 'low',
      'moderate': 'medium',
      'aggressive': 'high'
    };
    return riskMapping[userProfile.riskTolerance.toLowerCase()] || 'medium';
  }

  /**
   * Fallback strategy when OpenAI is unavailable
   */
  generateFallbackStrategy(userProfile, opportunities) {
    const balance = userProfile.walletBalance;
    const risk = userProfile.riskTolerance.toLowerCase();
    
    let allocation = {};
    if (risk === 'conservative') {
      allocation = {
        'Aave USDC': '70%',
        'Lido Staking': '30%'
      };
    } else if (risk === 'aggressive') {
      allocation = {
        'Lido Staking': '60%',
        'Aave WETH': '40%'
      };
    } else {
      allocation = {
        'Lido Staking': '50%',
        'Aave USDC': '30%',
        'Aave WETH': '20%'
      };
    }

    const strategy = `
**Automated DeFi Strategy Recommendation**

**1. Recommended Allocation:**
${Object.entries(allocation).map(([protocol, percent]) => `- ${protocol}: ${percent}`).join('\n')}

**2. Risk Assessment:**
- Overall Risk Level: ${this.assessRiskLevel(userProfile, opportunities).toUpperCase()}
- Your risk tolerance (${userProfile.riskTolerance}) matches this strategy

**3. Expected Returns:**
- Estimated Annual Yield: ${risk === 'conservative' ? '3-5%' : risk === 'aggressive' ? '5-8%' : '4-6%'}
- Based on current market conditions and historical performance

**4. Implementation Steps:**
1. Convert ${allocation['Aave USDC'] || '0%'} of portfolio to USDC for Aave lending
2. Stake ${allocation['Lido Staking'] || '0%'} in Lido for ETH staking rewards
3. Allocate remaining ${allocation['Aave WETH'] || '0%'} to Aave WETH lending

**5. Exit Strategy:**
- Monitor APY changes monthly
- Consider rebalancing if APY differentials change by >1%
- Maintain emergency fund outside of DeFi protocols

*Note: This is a fallback strategy. For personalized advice, ensure OpenAI API is configured.*
    `.trim();

    return {
      strategy: strategy,
      userProfile: userProfile,
      opportunities: opportunities,
      timestamp: new Date().toISOString(),
      confidence: 'medium',
      riskLevel: this.assessRiskLevel(userProfile, opportunities),
      fallback: true
    };
  }
}