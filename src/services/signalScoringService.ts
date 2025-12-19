import { Signal } from '../trading/types';

export interface SignalMeta {
  signal_id: string;
  primary_match: boolean;
  secondary_matches: string[];
  secondary_count: number;
  confidence_score: number;
  assigned_milestone: 'M1' | 'M2' | 'M3' | 'M4';
  milestone_assigned_at: string;
  score_details: {
    base_score: number;
    secondary_scores: Record<string, number>;
    weights: Record<string, number>;
    raw_confidence: number;
    threshold_met: Record<string, boolean>;
  };
}

export interface ScoringConfig {
  base_score: number;
  weights: Record<string, number>;
  thresholds: {
    M1: { min_confidence: number; min_confirmations: number };
    M2: { min_confidence: number; min_confirmations: number };
    M3: { min_confidence: number; min_confirmations: number };
    M4: { min_confidence: number; min_confirmations: number };
  };
}

// Default scoring configuration - can be calibrated based on backtesting
const DEFAULT_CONFIG: ScoringConfig = {
  base_score: 0.5, // Baseline for primary logic match
  weights: {
    HTF_trend: 0.20,        // Higher timeframe trend alignment
    EMA_alignment: 0.15,    // EMA ribbon alignment
    RSI: 0.12,              // RSI oversold/overbought
    MACD: 0.10,             // MACD histogram momentum
    ATR_ok: 0.06,           // ATR volatility filter
    ADX: 0.05,              // ADX trend strength
    Volume: 0.04,           // Volume confirmation
    Spread_ok: 0.03,        // Spread filter
    News_ok: 0.05,          // News filter
    Session_ok: 0.05        // Trading session filter
  },
  thresholds: {
    M1: { min_confidence: 0.85, min_confirmations: 3 }, // ~90% target win rate
    M2: { min_confidence: 0.60, min_confirmations: 2 }, // ~60% target win rate
    M3: { min_confidence: 0.40, min_confirmations: 1 }, // ~40% target win rate
    M4: { min_confidence: 0.00, min_confirmations: 0 }  // ~25-30% target win rate
  }
};

class SignalScoringService {
  private config: ScoringConfig;

  constructor(config: ScoringConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Update scoring configuration (for calibration)
   */
  updateConfig(newConfig: Partial<ScoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ScoringConfig {
    return { ...this.config };
  }

  /**
   * Score a signal and assign milestone
   */
  async scoreSignal(signal: Signal): Promise<SignalMeta> {
    try {
      // Primary match is always true for existing signals
      const primary_match = true;

      // Evaluate secondary confirmations
      const secondary_matches = await this.evaluateSecondaryConfirmations(signal);
      const secondary_count = secondary_matches.length;

      // Calculate confidence score
      const { confidence_score, secondary_scores, raw_confidence } = this.calculateConfidenceScore(secondary_matches);

      // Assign milestone based on confidence and confirmations
      const assigned_milestone = this.assignMilestone(confidence_score, secondary_count);

      // Build threshold met object for debugging
      const threshold_met = {
        M1: confidence_score >= this.config.thresholds.M1.min_confidence && secondary_count >= this.config.thresholds.M1.min_confirmations,
        M2: confidence_score >= this.config.thresholds.M2.min_confidence && secondary_count >= this.config.thresholds.M2.min_confirmations,
        M3: confidence_score >= this.config.thresholds.M3.min_confidence && secondary_count >= this.config.thresholds.M3.min_confirmations,
        M4: confidence_score >= this.config.thresholds.M4.min_confidence && secondary_count >= this.config.thresholds.M4.min_confirmations
      };

      const signalMeta: SignalMeta = {
        signal_id: signal.id,
        primary_match,
        secondary_matches,
        secondary_count,
        confidence_score: Math.min(confidence_score, 0.999), // Cap at 0.999
        assigned_milestone,
        milestone_assigned_at: new Date().toISOString(),
        score_details: {
          base_score: this.config.base_score,
          secondary_scores,
          weights: this.config.weights,
          raw_confidence,
          threshold_met
        }
      };

      return signalMeta;
    } catch (error) {
      console.error('Error scoring signal:', error);
      // Return default scoring for failed signals
      return this.getDefaultSignalMeta(signal.id);
    }
  }

  /**
   * Batch score multiple signals
   */
  async batchScoreSignals(signals: Signal[]): Promise<SignalMeta[]> {
    const results: SignalMeta[] = [];
    
    for (const signal of signals) {
      try {
        const meta = await this.scoreSignal(signal);
        results.push(meta);
      } catch (error) {
        console.error(`Error scoring signal ${signal.id}:`, error);
        results.push(this.getDefaultSignalMeta(signal.id));
      }
    }

    return results;
  }

  /**
   * Evaluate secondary confirmations for a signal
   * This is where you would integrate with real market data APIs
   */
  private async evaluateSecondaryConfirmations(signal: Signal): Promise<string[]> {
    const matches: string[] = [];

    try {
      // Import the real technical indicators service
      const { technicalIndicators } = await import('./technicalIndicators');
      
      // Get all technical indicator results
      const indicatorResults = await technicalIndicators.evaluateAllConfirmations(signal);
      
      // Process results and determine matches based on confidence thresholds
      for (const result of indicatorResults) {
        // Consider it a match if confidence is above 0.5 (50%)
        if (result.confidence >= 0.5) {
          matches.push(result.name);
        }
      }

      return matches;
    } catch (error) {
      console.error('Error evaluating secondary confirmations:', error);
      
      // Fallback to mock implementation if real indicators fail
      return this.getMockSecondaryConfirmations(signal);
    }
  }

  /**
   * Fallback mock implementation for when real indicators are unavailable
   */
  private getMockSecondaryConfirmations(signal: Signal): string[] {
    const allConfirmations = Object.keys(this.config.weights);
    const matches: string[] = [];
    
    // Simulate realistic confirmation patterns based on signal characteristics
    const signalDirection = signal.direction?.toLowerCase() || signal.type?.toLowerCase();
    const isLong = signalDirection === 'long' || signalDirection === 'buy';
    
    // Higher probability for certain confirmations based on direction
    const probabilities: Record<string, number> = {
      HTF_trend: isLong ? 0.7 : 0.6,
      EMA_alignment: 0.65,
      RSI: isLong ? 0.6 : 0.7,
      MACD: 0.55,
      ATR_ok: 0.8, // Usually acceptable
      ADX: 0.5,
      Volume: 0.4,
      Spread_ok: 0.9, // Usually good
      News_ok: 0.7, // Usually no major news
      Session_ok: 0.6 // Depends on time
    };

    for (const confirmation of allConfirmations) {
      const probability = probabilities[confirmation] || 0.5;
      if (Math.random() < probability) {
        matches.push(confirmation);
      }
    }

    return matches;
  }

  /**
   * Calculate confidence score based on secondary matches
   */
  private calculateConfidenceScore(secondary_matches: string[]): {
    confidence_score: number;
    secondary_scores: Record<string, number>;
    raw_confidence: number;
  } {
    const secondary_scores: Record<string, number> = {};
    let secondary_score = 0;

    // Calculate weighted secondary score
    for (const match of secondary_matches) {
      const weight = this.config.weights[match] || 0;
      secondary_scores[match] = weight;
      secondary_score += weight;
    }

    const raw_confidence = this.config.base_score + secondary_score;
    const confidence_score = Math.min(raw_confidence, 0.999);

    return {
      confidence_score,
      secondary_scores,
      raw_confidence
    };
  }

  /**
   * Assign milestone based on confidence score and confirmation count
   */
  private assignMilestone(confidence_score: number, secondary_count: number): 'M1' | 'M2' | 'M3' | 'M4' {
    const { thresholds } = this.config;

    if (confidence_score >= thresholds.M1.min_confidence && secondary_count >= thresholds.M1.min_confirmations) {
      return 'M1';
    } else if (confidence_score >= thresholds.M2.min_confidence && secondary_count >= thresholds.M2.min_confirmations) {
      return 'M2';
    } else if (confidence_score >= thresholds.M3.min_confidence && secondary_count >= thresholds.M3.min_confirmations) {
      return 'M3';
    } else {
      return 'M4';
    }
  }

  /**
   * Get default signal meta for failed scoring
   */
  private getDefaultSignalMeta(signal_id: string): SignalMeta {
    return {
      signal_id,
      primary_match: true,
      secondary_matches: [],
      secondary_count: 0,
      confidence_score: this.config.base_score,
      assigned_milestone: 'M4',
      milestone_assigned_at: new Date().toISOString(),
      score_details: {
        base_score: this.config.base_score,
        secondary_scores: {},
        weights: this.config.weights,
        raw_confidence: this.config.base_score,
        threshold_met: { M1: false, M2: false, M3: false, M4: true }
      }
    };
  }
}

// Export singleton instance
export const signalScoringService = new SignalScoringService();
export default signalScoringService;
