import axios from 'axios';
import { ethers } from 'ethers';

/**
 * Service to fetch DeFi protocol data including APYs from Lido and Aave
 */
export class DeFiDataService {
  constructor(infuraApiKey) {
    this.provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${infuraApiKey}`);
  }

  /**
   * Fetch Lido staking APY
   */
  async getLidoAPY() {
    try {
      // Lido APY endpoint - using their public API
      const response = await axios.get('https://stake.lido.fi/api/rewards');
      return {
        protocol: 'Lido',
        apy: response.data.apr || 4.5, // fallback to 4.5% if API fails
        risk: 'Medium',
        description: 'Ethereum 2.0 staking rewards'
      };
    } catch (error) {
      console.warn('Failed to fetch Lido APY, using fallback:', error.message);
      return {
        protocol: 'Lido',
        apy: 4.5,
        risk: 'Medium',
        description: 'Ethereum 2.0 staking rewards (estimated)'
      };
    }
  }

  /**
   * Fetch Aave lending APYs for major tokens
   */
  async getAaveAPYs() {
    try {
      // Aave v3 API endpoint
      const response = await axios.get('https://aave-api-v2.aave.com/data/markets-data');
      const markets = response.data.reserves || [];
      
      // Filter for major tokens (USDC, USDT, DAI, WETH)
      const majorTokens = ['USDC', 'USDT', 'DAI', 'WETH'];
      const aaveData = markets
        .filter(market => majorTokens.includes(market.symbol))
        .map(market => ({
          protocol: 'Aave',
          token: market.symbol,
          supplyAPY: parseFloat(market.liquidityRate) * 100,
          borrowAPY: parseFloat(market.variableBorrowRate) * 100,
          risk: 'Low-Medium',
          description: `Lending ${market.symbol} on Aave v3`
        }));

      return aaveData.length > 0 ? aaveData : this.getAaveFallbackData();
    } catch (error) {
      console.warn('Failed to fetch Aave APY, using fallback:', error.message);
      return this.getAaveFallbackData();
    }
  }

  /**
   * Fallback Aave data when API is unavailable
   */
  getAaveFallbackData() {
    return [
      {
        protocol: 'Aave',
        token: 'USDC',
        supplyAPY: 3.2,
        borrowAPY: 4.5,
        risk: 'Low-Medium',
        description: 'Lending USDC on Aave v3 (estimated)'
      },
      {
        protocol: 'Aave',
        token: 'WETH',
        supplyAPY: 2.8,
        borrowAPY: 3.9,
        risk: 'Low-Medium',
        description: 'Lending WETH on Aave v3 (estimated)'
      }
    ];
  }

  /**
   * Get all available DeFi opportunities
   */
  async getAllOpportunities() {
    try {
      const [lidoData, aaveData] = await Promise.all([
        this.getLidoAPY(),
        this.getAaveAPYs()
      ]);

      return {
        lido: lidoData,
        aave: aaveData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch DeFi data: ${error.message}`);
    }
  }
}