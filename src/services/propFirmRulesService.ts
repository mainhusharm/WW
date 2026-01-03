import api from '../lib/api';

export interface PropFirmRules {
  id: number;
  name: string;
  website?: string;
  hft_allowed: boolean | null;
  hft_min_hold_time: number | null;
  hft_max_trades_per_day: number | null;
  martingale_allowed: boolean | null;
  martingale_max_positions: number | null;
  max_lot_size: number | null;
  max_risk_per_trade: number | null;
  reverse_trading_allowed: boolean | null;
  reverse_trading_cooldown: number | null;
  daily_loss_limit: number | null;
  max_drawdown: number | null;
  profit_target_phase1: number | null;
  profit_target_phase2: number | null;
  min_trading_days: number | null;
  consistency_rule: number | null;
  leverage: {
    forex: number | null;
    metals: number | null;
    crypto: number | null;
  };
  news_trading: string | null;
  weekend_holding: string | null;
  last_updated: string;
  last_scraped: string | null;
  scraping_status: string | null;
  rules_source_url: string | null;
  rules_last_verified: string | null;
}

export interface TradingActivity {
  hold_time_seconds: number;
  trades_today: number;
  martingale_positions: number;
  lot_size: number;
  reverse_trading: boolean;
}

export interface ComplianceResult {
  compliant: boolean;
  warnings: string[];
  recommendations: string[];
  firm_rules: PropFirmRules;
}

class PropFirmRulesService {
  private baseUrl = '/api/dashboard';

  /**
   * Get prop firm rules by name
   */
  async getPropFirmRules(firmName: string): Promise<PropFirmRules> {
    try {
      const response = await api.get(`${this.baseUrl}/prop-firm-rules`, {
        params: { firm_name: firmName }
      });
      return response.data.firm;
    } catch (error) {
      console.error('Error fetching prop firm rules:', error);
      throw error;
    }
  }

  /**
   * Get all prop firm rules
   */
  async getAllPropFirmRules(limit = 100, offset = 0, status?: string): Promise<{
    firms: PropFirmRules[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const params: any = { limit, offset };
      if (status) params.status = status;
      
      const response = await api.get(`${this.baseUrl}/prop-firm-rules/all`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all prop firm rules:', error);
      throw error;
    }
  }

  /**
   * Check compliance with prop firm rules
   */
  async checkCompliance(firmName: string, tradingActivity: TradingActivity): Promise<ComplianceResult> {
    try {
      const response = await api.post(`${this.baseUrl}/prop-firm-compliance`, {
        firm_name: firmName,
        trading_activity: tradingActivity
      });
      return response.data.compliance;
    } catch (error) {
      console.error('Error checking compliance:', error);
      throw error;
    }
  }

  /**
   * Update prop firm rules (admin only)
   */
  async updatePropFirmRules(firmName: string, rules: Partial<PropFirmRules>): Promise<boolean> {
    try {
      const response = await api.post(`${this.baseUrl}/prop-firm-rules/update`, {
        firm_name: firmName,
        rules
      });
      return response.data.status === 'success';
    } catch (error) {
      console.error('Error updating prop firm rules:', error);
      throw error;
    }
  }

  /**
   * Trigger scraping of all prop firm rules (admin only)
   */
  async scrapeAllPropFirmRules(): Promise<boolean> {
    try {
      const response = await api.post(`${this.baseUrl}/prop-firm-rules/scrape`);
      return response.data.status === 'success';
    } catch (error) {
      console.error('Error triggering scraping:', error);
      throw error;
    }
  }

  /**
   * Get compliance warnings for a specific trading action
   */
  getComplianceWarnings(firmRules: PropFirmRules, tradingActivity: TradingActivity): {
    warnings: string[];
    recommendations: string[];
    compliant: boolean;
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let compliant = true;

    // Check HFT compliance
    if (firmRules.hft_allowed === false && tradingActivity.hold_time_seconds < 60) {
      warnings.push(`HFT not allowed. Minimum hold time: ${firmRules.hft_min_hold_time || 60} seconds`);
      compliant = false;
      recommendations.push("Hold positions for at least 60 seconds");
    }

    if (firmRules.hft_max_trades_per_day && tradingActivity.trades_today > firmRules.hft_max_trades_per_day) {
      warnings.push(`Maximum HFT trades per day exceeded: ${firmRules.hft_max_trades_per_day}`);
      compliant = false;
      recommendations.push("Reduce number of trades per day");
    }

    // Check martingale compliance
    if (firmRules.martingale_allowed === false && tradingActivity.martingale_positions > 1) {
      warnings.push("Martingale strategy not allowed");
      compliant = false;
      recommendations.push("Avoid increasing position sizes");
    }

    // Check lot size compliance
    if (firmRules.max_lot_size && tradingActivity.lot_size > firmRules.max_lot_size) {
      warnings.push(`Lot size exceeds maximum: ${firmRules.max_lot_size}`);
      compliant = false;
      recommendations.push(`Reduce lot size to maximum ${firmRules.max_lot_size}`);
    }

    // Check reverse trading compliance
    if (firmRules.reverse_trading_allowed === false && tradingActivity.reverse_trading) {
      warnings.push("Reverse trading not allowed");
      compliant = false;
      recommendations.push("Wait before taking opposite positions");
    }

    return { warnings, recommendations, compliant };
  }

  /**
   * Format prop firm rules for display
   */
  formatRulesForDisplay(firmRules: PropFirmRules): {
    hft: { allowed: boolean; details: string };
    martingale: { allowed: boolean; details: string };
    lotSize: { limit: string; details: string };
    reverseTrading: { allowed: boolean; details: string };
  } {
    return {
      hft: {
        allowed: firmRules.hft_allowed || false,
        details: firmRules.hft_allowed 
          ? `Allowed (min hold: ${firmRules.hft_min_hold_time || 60}s, max trades/day: ${firmRules.hft_max_trades_per_day || 10})`
          : `Not allowed (min hold: ${firmRules.hft_min_hold_time || 60}s)`
      },
      martingale: {
        allowed: firmRules.martingale_allowed || false,
        details: firmRules.martingale_allowed
          ? `Allowed (max positions: ${firmRules.martingale_max_positions || 1})`
          : 'Not allowed'
      },
      lotSize: {
        limit: firmRules.max_lot_size ? `${firmRules.max_lot_size} lots` : 'No limit',
        details: firmRules.max_risk_per_trade 
          ? `Max risk per trade: ${firmRules.max_risk_per_trade}%`
          : 'No specific risk limit'
      },
      reverseTrading: {
        allowed: firmRules.reverse_trading_allowed || false,
        details: firmRules.reverse_trading_allowed
          ? `Allowed (cooldown: ${firmRules.reverse_trading_cooldown || 0} min)`
          : 'Not allowed'
      }
    };
  }
}

export default new PropFirmRulesService();
