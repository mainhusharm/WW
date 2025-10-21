import { signalScoringService, SignalMeta, ScoringConfig } from './signalScoringService';
import { Signal } from '../trading/types';

// Mock signal data for testing
const createMockSignal = (overrides: Partial<Signal> = {}): Signal => ({
  id: 'test-signal-1',
  pair: 'EURUSD',
  direction: 'LONG',
  entry: '1.0850',
  entryPrice: 1.0850,
  stopLoss: '1.0800',
  takeProfit: '1.0950',
  confidence: 85,
  timestamp: new Date().toISOString(),
  status: 'active',
  market: 'forex',
  type: 'buy',
  ...overrides
});

describe('SignalScoringService', () => {
  beforeEach(() => {
    // Reset to default configuration before each test
    const defaultConfig: ScoringConfig = {
      base_score: 0.5,
      weights: {
        HTF_trend: 0.20,
        EMA_alignment: 0.15,
        RSI: 0.12,
        MACD: 0.10,
        ATR_ok: 0.06,
        ADX: 0.05,
        Volume: 0.04,
        Spread_ok: 0.03,
        News_ok: 0.05,
        Session_ok: 0.05
      },
      thresholds: {
        M1: { min_confidence: 0.85, min_confirmations: 3 },
        M2: { min_confidence: 0.60, min_confirmations: 2 },
        M3: { min_confidence: 0.40, min_confirmations: 1 },
        M4: { min_confidence: 0.00, min_confirmations: 0 }
      }
    };
    signalScoringService.updateConfig(defaultConfig);
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      const newConfig: Partial<ScoringConfig> = {
        base_score: 0.6,
        weights: {
          HTF_trend: 0.25,
          EMA_alignment: 0.20
        }
      };

      signalScoringService.updateConfig(newConfig);
      const config = signalScoringService.getConfig();

      expect(config.base_score).toBe(0.6);
      expect(config.weights.HTF_trend).toBe(0.25);
      expect(config.weights.EMA_alignment).toBe(0.20);
      // Other weights should remain unchanged
      expect(config.weights.RSI).toBe(0.12);
    });

    it('should return current configuration', () => {
      const config = signalScoringService.getConfig();
      
      expect(config).toBeDefined();
      expect(config.base_score).toBe(0.5);
      expect(config.weights).toBeDefined();
      expect(config.thresholds).toBeDefined();
      expect(Object.keys(config.thresholds)).toEqual(['M1', 'M2', 'M3', 'M4']);
    });
  });

  describe('Signal Scoring', () => {
    it('should score a basic signal correctly', async () => {
      const signal = createMockSignal();
      const meta = await signalScoringService.scoreSignal(signal);

      expect(meta).toBeDefined();
      expect(meta.signal_id).toBe(signal.id);
      expect(meta.primary_match).toBe(true);
      expect(meta.confidence_score).toBeGreaterThanOrEqual(0.5); // At least base score
      expect(meta.confidence_score).toBeLessThan(1.0); // Capped below 1.0
      expect(meta.assigned_milestone).toMatch(/^M[1-4]$/);
      expect(meta.secondary_matches).toBeInstanceOf(Array);
      expect(meta.secondary_count).toBe(meta.secondary_matches.length);
    });

    it('should assign correct milestone based on confidence and confirmations', async () => {
      // Mock the evaluateSecondaryConfirmations to return specific results
      const originalMethod = (signalScoringService as any).evaluateSecondaryConfirmations;
      
      // Test M1 assignment (high confidence, many confirmations)
      (signalScoringService as any).evaluateSecondaryConfirmations = jest.fn()
        .mockResolvedValue(['HTF_trend', 'EMA_alignment', 'RSI', 'MACD']);

      const signal1 = createMockSignal();
      const meta1 = await signalScoringService.scoreSignal(signal1);
      
      expect(meta1.assigned_milestone).toBe('M1');
      expect(meta1.confidence_score).toBeGreaterThanOrEqual(0.85);
      expect(meta1.secondary_count).toBeGreaterThanOrEqual(3);

      // Test M4 assignment (low confidence, few confirmations)
      (signalScoringService as any).evaluateSecondaryConfirmations = jest.fn()
        .mockResolvedValue([]);

      const signal4 = createMockSignal();
      const meta4 = await signalScoringService.scoreSignal(signal4);
      
      expect(meta4.assigned_milestone).toBe('M4');
      expect(meta4.secondary_count).toBe(0);

      // Restore original method
      (signalScoringService as any).evaluateSecondaryConfirmations = originalMethod;
    });

    it('should handle scoring errors gracefully', async () => {
      // Create a signal that might cause errors
      const invalidSignal = createMockSignal({
        id: '',
        pair: '',
        entry: 'invalid',
        entryPrice: NaN
      });

      const meta = await signalScoringService.scoreSignal(invalidSignal);

      // Should return default metadata instead of throwing
      expect(meta).toBeDefined();
      expect(meta.assigned_milestone).toBe('M4');
      expect(meta.confidence_score).toBe(0.5);
      expect(meta.secondary_matches).toEqual([]);
    });

    it('should cap confidence score at 0.999', async () => {
      // Mock to return all possible confirmations
      const originalMethod = (signalScoringService as any).evaluateSecondaryConfirmations;
      (signalScoringService as any).evaluateSecondaryConfirmations = jest.fn()
        .mockResolvedValue([
          'HTF_trend', 'EMA_alignment', 'RSI', 'MACD', 'ATR_ok',
          'ADX', 'Volume', 'Spread_ok', 'News_ok', 'Session_ok'
        ]);

      const signal = createMockSignal();
      const meta = await signalScoringService.scoreSignal(signal);

      expect(meta.confidence_score).toBeLessThan(1.0);
      expect(meta.confidence_score).toBeLessThanOrEqual(0.999);

      // Restore original method
      (signalScoringService as any).evaluateSecondaryConfirmations = originalMethod;
    });
  });

  describe('Batch Scoring', () => {
    it('should score multiple signals correctly', async () => {
      const signals = [
        createMockSignal({ id: 'signal-1', pair: 'EURUSD' }),
        createMockSignal({ id: 'signal-2', pair: 'GBPUSD' }),
        createMockSignal({ id: 'signal-3', pair: 'USDJPY' })
      ];

      const metas = await signalScoringService.batchScoreSignals(signals);

      expect(metas).toHaveLength(3);
      expect(metas[0].signal_id).toBe('signal-1');
      expect(metas[1].signal_id).toBe('signal-2');
      expect(metas[2].signal_id).toBe('signal-3');

      // All should have valid scores
      metas.forEach(meta => {
        expect(meta.confidence_score).toBeGreaterThanOrEqual(0.5);
        expect(meta.confidence_score).toBeLessThan(1.0);
        expect(meta.assigned_milestone).toMatch(/^M[1-4]$/);
      });
    });

    it('should handle errors in batch scoring gracefully', async () => {
      const signals = [
        createMockSignal({ id: 'valid-signal' }),
        createMockSignal({ id: '', pair: '' }), // Invalid signal
        createMockSignal({ id: 'another-valid-signal' })
      ];

      const metas = await signalScoringService.batchScoreSignals(signals);

      expect(metas).toHaveLength(3);
      
      // Valid signals should be scored normally
      expect(metas[0].signal_id).toBe('valid-signal');
      expect(metas[2].signal_id).toBe('another-valid-signal');
      
      // Invalid signal should get default metadata
      expect(metas[1].assigned_milestone).toBe('M4');
      expect(metas[1].confidence_score).toBe(0.5);
    });

    it('should handle empty signal array', async () => {
      const metas = await signalScoringService.batchScoreSignals([]);
      expect(metas).toEqual([]);
    });
  });

  describe('Milestone Assignment Logic', () => {
    it('should assign M1 for high confidence and confirmations', async () => {
      // Mock high confidence scenario
      const originalMethod = (signalScoringService as any).evaluateSecondaryConfirmations;
      (signalScoringService as any).evaluateSecondaryConfirmations = jest.fn()
        .mockResolvedValue(['HTF_trend', 'EMA_alignment', 'RSI', 'MACD', 'ATR_ok']);

      const signal = createMockSignal();
      const meta = await signalScoringService.scoreSignal(signal);

      expect(meta.assigned_milestone).toBe('M1');
      expect(meta.score_details.threshold_met.M1).toBe(true);

      // Restore original method
      (signalScoringService as any).evaluateSecondaryConfirmations = originalMethod;
    });

    it('should assign M2 for moderate confidence', async () => {
      // Mock moderate confidence scenario
      const originalMethod = (signalScoringService as any).evaluateSecondaryConfirmations;
      (signalScoringService as any).evaluateSecondaryConfirmations = jest.fn()
        .mockResolvedValue(['HTF_trend', 'EMA_alignment']);

      const signal = createMockSignal();
      const meta = await signalScoringService.scoreSignal(signal);

      expect(meta.assigned_milestone).toBe('M2');
      expect(meta.score_details.threshold_met.M2).toBe(true);
      expect(meta.score_details.threshold_met.M1).toBe(false);

      // Restore original method
      (signalScoringService as any).evaluateSecondaryConfirmations = originalMethod;
    });

    it('should assign M3 for low confidence', async () => {
      // Mock low confidence scenario
      const originalMethod = (signalScoringService as any).evaluateSecondaryConfirmations;
      (signalScoringService as any).evaluateSecondaryConfirmations = jest.fn()
        .mockResolvedValue(['RSI']);

      const signal = createMockSignal();
      const meta = await signalScoringService.scoreSignal(signal);

      expect(meta.assigned_milestone).toBe('M3');
      expect(meta.score_details.threshold_met.M3).toBe(true);
      expect(meta.score_details.threshold_met.M2).toBe(false);
      expect(meta.score_details.threshold_met.M1).toBe(false);

      // Restore original method
      (signalScoringService as any).evaluateSecondaryConfirmations = originalMethod;
    });

    it('should assign M4 for minimal confidence', async () => {
      // Mock minimal confidence scenario
      const originalMethod = (signalScoringService as any).evaluateSecondaryConfirmations;
      (signalScoringService as any).evaluateSecondaryConfirmations = jest.fn()
        .mockResolvedValue([]);

      const signal = createMockSignal();
      const meta = await signalScoringService.scoreSignal(signal);

      expect(meta.assigned_milestone).toBe('M4');
      expect(meta.score_details.threshold_met.M4).toBe(true);
      expect(meta.score_details.threshold_met.M3).toBe(false);

      // Restore original method
      (signalScoringService as any).evaluateSecondaryConfirmations = originalMethod;
    });
  });

  describe('Score Details', () => {
    it('should provide detailed scoring breakdown', async () => {
      const signal = createMockSignal();
      const meta = await signalScoringService.scoreSignal(signal);

      expect(meta.score_details).toBeDefined();
      expect(meta.score_details.base_score).toBe(0.5);
      expect(meta.score_details.weights).toBeDefined();
      expect(meta.score_details.secondary_scores).toBeDefined();
      expect(meta.score_details.raw_confidence).toBeGreaterThanOrEqual(0.5);
      expect(meta.score_details.threshold_met).toBeDefined();
      
      // Threshold met should have all milestones
      expect(Object.keys(meta.score_details.threshold_met)).toEqual(['M1', 'M2', 'M3', 'M4']);
    });

    it('should calculate secondary scores correctly', async () => {
      // Mock specific confirmations
      const originalMethod = (signalScoringService as any).evaluateSecondaryConfirmations;
      (signalScoringService as any).evaluateSecondaryConfirmations = jest.fn()
        .mockResolvedValue(['HTF_trend', 'RSI']);

      const signal = createMockSignal();
      const meta = await signalScoringService.scoreSignal(signal);

      expect(meta.score_details.secondary_scores.HTF_trend).toBe(0.20);
      expect(meta.score_details.secondary_scores.RSI).toBe(0.12);
      expect(meta.score_details.raw_confidence).toBe(0.5 + 0.20 + 0.12); // base + HTF + RSI

      // Restore original method
      (signalScoringService as any).evaluateSecondaryConfirmations = originalMethod;
    });
  });

  describe('Edge Cases', () => {
    it('should handle signals with missing required fields', async () => {
      const incompleteSignal = {
        id: 'incomplete-signal'
        // Missing other required fields
      } as Signal;

      const meta = await signalScoringService.scoreSignal(incompleteSignal);

      expect(meta).toBeDefined();
      expect(meta.signal_id).toBe('incomplete-signal');
      expect(meta.assigned_milestone).toBe('M4'); // Should default to M4
    });

    it('should handle different currency pairs correctly', async () => {
      const signals = [
        createMockSignal({ pair: 'EURUSD', market: 'forex' }),
        createMockSignal({ pair: 'USDJPY', market: 'forex' }),
        createMockSignal({ pair: 'BTCUSDT', market: 'crypto' }),
        createMockSignal({ pair: 'ETHUSDT', market: 'crypto' })
      ];

      const metas = await signalScoringService.batchScoreSignals(signals);

      expect(metas).toHaveLength(4);
      metas.forEach(meta => {
        expect(meta.confidence_score).toBeGreaterThanOrEqual(0.5);
        expect(meta.assigned_milestone).toMatch(/^M[1-4]$/);
      });
    });

    it('should handle different signal directions', async () => {
      const signals = [
        createMockSignal({ direction: 'LONG', type: 'buy' }),
        createMockSignal({ direction: 'SHORT', type: 'sell' }),
        createMockSignal({ direction: 'long', type: 'buy' }),
        createMockSignal({ direction: 'short', type: 'sell' })
      ];

      const metas = await signalScoringService.batchScoreSignals(signals);

      expect(metas).toHaveLength(4);
      metas.forEach(meta => {
        expect(meta.confidence_score).toBeGreaterThanOrEqual(0.5);
        expect(meta.assigned_milestone).toMatch(/^M[1-4]$/);
      });
    });
  });

  describe('Threshold Validation', () => {
    it('should respect custom thresholds', () => {
      const customConfig: Partial<ScoringConfig> = {
        thresholds: {
          M1: { min_confidence: 0.90, min_confirmations: 4 },
          M2: { min_confidence: 0.70, min_confirmations: 3 },
          M3: { min_confidence: 0.50, min_confirmations: 2 },
          M4: { min_confidence: 0.00, min_confirmations: 0 }
        }
      };

      signalScoringService.updateConfig(customConfig);
      const config = signalScoringService.getConfig();

      expect(config.thresholds.M1.min_confidence).toBe(0.90);
      expect(config.thresholds.M1.min_confirmations).toBe(4);
      expect(config.thresholds.M2.min_confidence).toBe(0.70);
      expect(config.thresholds.M2.min_confirmations).toBe(3);
    });

    it('should maintain threshold hierarchy', () => {
      const config = signalScoringService.getConfig();

      expect(config.thresholds.M1.min_confidence).toBeGreaterThanOrEqual(config.thresholds.M2.min_confidence);
      expect(config.thresholds.M2.min_confidence).toBeGreaterThanOrEqual(config.thresholds.M3.min_confidence);
      expect(config.thresholds.M3.min_confidence).toBeGreaterThanOrEqual(config.thresholds.M4.min_confidence);
    });
  });
});

// Integration tests with mock data
describe('SignalScoringService Integration', () => {
  it('should process realistic signal data correctly', async () => {
    const realisticSignals: Signal[] = [
      {
        id: 'eur-usd-001',
        pair: 'EURUSD',
        direction: 'LONG',
        entry: '1.0850',
        entryPrice: 1.0850,
        stopLoss: '1.0800',
        takeProfit: '1.0950',
        confidence: 88,
        timestamp: new Date().toISOString(),
        status: 'active',
        market: 'forex',
        type: 'buy',
        analysis: 'Strong bullish momentum with HTF support'
      },
      {
        id: 'btc-usdt-001',
        pair: 'BTCUSDT',
        direction: 'SHORT',
        entry: '45000',
        entryPrice: 45000,
        stopLoss: '46000',
        takeProfit: '43000',
        confidence: 72,
        timestamp: new Date().toISOString(),
        status: 'active',
        market: 'crypto',
        type: 'sell',
        analysis: 'Bearish divergence on 4H chart'
      }
    ];

    const metas = await signalScoringService.batchScoreSignals(realisticSignals);

    expect(metas).toHaveLength(2);
    
    // EUR/USD signal should likely get higher milestone due to higher confidence
    const eurMeta = metas.find(m => m.signal_id === 'eur-usd-001');
    const btcMeta = metas.find(m => m.signal_id === 'btc-usdt-001');

    expect(eurMeta).toBeDefined();
    expect(btcMeta).toBeDefined();

    // Both should have valid scoring
    expect(eurMeta!.confidence_score).toBeGreaterThanOrEqual(0.5);
    expect(btcMeta!.confidence_score).toBeGreaterThanOrEqual(0.5);
    
    expect(eurMeta!.assigned_milestone).toMatch(/^M[1-4]$/);
    expect(btcMeta!.assigned_milestone).toMatch(/^M[1-4]$/);
  });
});
