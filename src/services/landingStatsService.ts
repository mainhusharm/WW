import api from '../api';

export interface LandingStats {
  fundedAccounts: number;
  successRate: number;
  totalFunded: number;
  propFirms: number;
  successfulTraders: number;
}

class LandingStatsService {
  private statsCache: LandingStats | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 300000; // 5 minutes

  /**
   * Fetch landing page statistics from the backend
   */
  async getLandingStats(): Promise<LandingStats> {
    try {
      // Check cache first
      if (this.statsCache && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
        return this.statsCache;
      }

      // Fetch from backend
      const response = await api.get('/api/landing/stats');
      
      if (response.data) {
        const stats: LandingStats = {
          fundedAccounts: response.data.funded_accounts || 0,
          successRate: response.data.success_rate || 0,
          totalFunded: response.data.total_funded || 0,
          propFirms: response.data.prop_firms || 0,
          successfulTraders: response.data.successful_traders || 0
        };

        // Cache the results
        this.statsCache = stats;
        this.cacheTimestamp = Date.now();

        return stats;
      }

      // Return default stats if API fails
      return this.getDefaultStats();
    } catch (error) {
      console.error('Error fetching landing stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Get default statistics (fallback)
   */
  private getDefaultStats(): LandingStats {
    return {
      fundedAccounts: 2847,  // Updated to correct number
      successRate: 86.7,     // Updated to match backend
      totalFunded: 47.2,     // Updated to match backend
      propFirms: 150,
      successfulTraders: 2847
    };
  }

  /**
   * Format statistics for display
   */
  formatStats(stats: LandingStats) {
    return [
      { 
        number: stats.fundedAccounts.toLocaleString(), 
        label: "Funded Accounts", 
        description: "Successfully cleared" 
      },
      { 
        number: `${stats.successRate}%`, 
        label: "Success Rate", 
        description: "Challenge completion" 
      },
      { 
        number: `$${stats.totalFunded}M`, 
        label: "Total Funded", 
        description: "Across all prop firms" 
      },
      { 
        number: `${stats.propFirms}+`, 
        label: "Prop Firms", 
        description: "Supported platforms" 
      }
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.statsCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { cached: boolean; age: number } {
    return {
      cached: this.statsCache !== null,
      age: this.cacheTimestamp ? Date.now() - this.cacheTimestamp : 0
    };
  }
}

export default new LandingStatsService();
