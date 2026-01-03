#!/usr/bin/env python3
"""
Milestone Backtest Script for TraderEdgePro
Analyzes historical signals and optimizes milestone thresholds to achieve target win rates.
"""

import json
import csv
import random
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import argparse
from dataclasses import dataclass

@dataclass
class SignalResult:
    """Represents a historical signal with its outcome"""
    signal_id: str
    pair: str
    direction: str
    entry_price: float
    stop_loss: float
    take_profit: float
    confidence_score: float
    secondary_matches: List[str]
    secondary_count: int
    assigned_milestone: str
    outcome: str  # 'won', 'lost', 'breakeven'
    pnl: float
    timestamp: datetime

@dataclass
class MilestoneThresholds:
    """Milestone threshold configuration"""
    M1_confidence: float = 0.85
    M1_confirmations: int = 3
    M2_confidence: float = 0.60
    M2_confirmations: int = 2
    M3_confidence: float = 0.40
    M3_confirmations: int = 1
    M4_confidence: float = 0.00
    M4_confirmations: int = 0

class MilestoneBacktester:
    """Backtests milestone system and optimizes thresholds"""
    
    def __init__(self):
        self.target_win_rates = {
            'M1': 0.90,  # 90% target
            'M2': 0.60,  # 60% target
            'M3': 0.40,  # 40% target
            'M4': 0.28   # 25-30% target (using 28% as middle)
        }
        
        self.secondary_indicators = [
            'HTF_trend', 'EMA_alignment', 'RSI', 'MACD', 'ATR_ok',
            'ADX', 'Volume', 'Spread_ok', 'News_ok', 'Session_ok'
        ]
        
        self.weights = {
            'HTF_trend': 0.20,
            'EMA_alignment': 0.15,
            'RSI': 0.12,
            'MACD': 0.10,
            'ATR_ok': 0.06,
            'ADX': 0.05,
            'Volume': 0.04,
            'Spread_ok': 0.03,
            'News_ok': 0.05,
            'Session_ok': 0.05
        }
    
    def generate_mock_historical_data(self, num_signals: int = 1000) -> List[SignalResult]:
        """Generate mock historical signal data for testing"""
        signals = []
        
        for i in range(num_signals):
            # Generate random signal parameters
            pairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'BTCUSDT', 'ETHUSDT']
            pair = random.choice(pairs)
            direction = random.choice(['LONG', 'SHORT'])
            
            # Generate realistic price data
            if 'USD' in pair:
                entry_price = random.uniform(0.8, 1.8)
                pip_size = 0.0001 if 'JPY' not in pair else 0.01
            else:  # Crypto
                entry_price = random.uniform(20000, 70000)
                pip_size = 1.0
            
            # Generate stop loss and take profit
            sl_distance = random.uniform(20, 100) * pip_size
            tp_distance = random.uniform(40, 200) * pip_size
            
            if direction == 'LONG':
                stop_loss = entry_price - sl_distance
                take_profit = entry_price + tp_distance
            else:
                stop_loss = entry_price + sl_distance
                take_profit = entry_price - tp_distance
            
            # Generate secondary confirmations (realistic distribution)
            num_confirmations = np.random.choice([0, 1, 2, 3, 4, 5], 
                                               p=[0.15, 0.25, 0.25, 0.20, 0.10, 0.05])
            secondary_matches = random.sample(self.secondary_indicators, 
                                            min(num_confirmations, len(self.secondary_indicators)))
            
            # Calculate confidence score
            base_score = 0.5
            secondary_score = sum(self.weights.get(match, 0) for match in secondary_matches)
            confidence_score = min(base_score + secondary_score, 0.999)
            
            # Assign milestone based on current thresholds
            assigned_milestone = self._assign_milestone(confidence_score, len(secondary_matches))
            
            # Generate realistic outcome based on confidence (higher confidence = higher win rate)
            win_probability = self._calculate_win_probability(confidence_score, len(secondary_matches))
            outcome = np.random.choice(['won', 'lost', 'breakeven'], 
                                     p=[win_probability, 1 - win_probability - 0.05, 0.05])
            
            # Calculate P&L
            if outcome == 'won':
                pnl = abs(take_profit - entry_price) * random.uniform(0.8, 1.0)  # Partial fills
            elif outcome == 'lost':
                pnl = -abs(stop_loss - entry_price) * random.uniform(0.8, 1.0)
            else:  # breakeven
                pnl = random.uniform(-5, 5)  # Small loss/gain
            
            # Generate timestamp
            timestamp = datetime.now() - timedelta(days=random.randint(1, 365))
            
            signal = SignalResult(
                signal_id=f"signal_{i:04d}",
                pair=pair,
                direction=direction,
                entry_price=entry_price,
                stop_loss=stop_loss,
                take_profit=take_profit,
                confidence_score=confidence_score,
                secondary_matches=secondary_matches,
                secondary_count=len(secondary_matches),
                assigned_milestone=assigned_milestone,
                outcome=outcome,
                pnl=pnl,
                timestamp=timestamp
            )
            
            signals.append(signal)
        
        return signals
    
    def _calculate_win_probability(self, confidence_score: float, secondary_count: int) -> float:
        """Calculate realistic win probability based on confidence and confirmations"""
        # Base probability from confidence score
        base_prob = 0.2 + (confidence_score - 0.5) * 0.8  # Maps 0.5-1.0 to 0.2-0.6
        
        # Bonus from secondary confirmations
        confirmation_bonus = min(secondary_count * 0.08, 0.3)  # Max 30% bonus
        
        # Add some randomness
        noise = random.uniform(-0.05, 0.05)
        
        return max(0.1, min(0.95, base_prob + confirmation_bonus + noise))
    
    def _assign_milestone(self, confidence_score: float, secondary_count: int, 
                         thresholds: Optional[MilestoneThresholds] = None) -> str:
        """Assign milestone based on confidence score and secondary confirmations"""
        if thresholds is None:
            thresholds = MilestoneThresholds()
        
        if (confidence_score >= thresholds.M1_confidence and 
            secondary_count >= thresholds.M1_confirmations):
            return 'M1'
        elif (confidence_score >= thresholds.M2_confidence and 
              secondary_count >= thresholds.M2_confirmations):
            return 'M2'
        elif (confidence_score >= thresholds.M3_confidence and 
              secondary_count >= thresholds.M3_confirmations):
            return 'M3'
        else:
            return 'M4'
    
    def calculate_milestone_performance(self, signals: List[SignalResult], 
                                      thresholds: Optional[MilestoneThresholds] = None) -> Dict:
        """Calculate performance metrics for each milestone"""
        if thresholds:
            # Reassign milestones with new thresholds
            for signal in signals:
                signal.assigned_milestone = self._assign_milestone(
                    signal.confidence_score, signal.secondary_count, thresholds
                )
        
        # Group signals by milestone
        milestone_groups = {'M1': [], 'M2': [], 'M3': [], 'M4': []}
        for signal in signals:
            milestone_groups[signal.assigned_milestone].append(signal)
        
        # Calculate metrics for each milestone
        results = {}
        for milestone, group in milestone_groups.items():
            if not group:
                results[milestone] = {
                    'total_signals': 0,
                    'win_rate': 0.0,
                    'total_pnl': 0.0,
                    'avg_pnl_per_trade': 0.0,
                    'profit_factor': 0.0,
                    'max_drawdown': 0.0
                }
                continue
            
            total_signals = len(group)
            winning_trades = [s for s in group if s.outcome == 'won']
            losing_trades = [s for s in group if s.outcome == 'lost']
            
            win_rate = len(winning_trades) / total_signals if total_signals > 0 else 0
            total_pnl = sum(s.pnl for s in group)
            avg_pnl = total_pnl / total_signals if total_signals > 0 else 0
            
            gross_profit = sum(s.pnl for s in winning_trades)
            gross_loss = abs(sum(s.pnl for s in losing_trades))
            profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
            
            # Calculate max drawdown
            running_pnl = 0
            peak = 0
            max_drawdown = 0
            for signal in sorted(group, key=lambda x: x.timestamp):
                running_pnl += signal.pnl
                if running_pnl > peak:
                    peak = running_pnl
                drawdown = (peak - running_pnl) / peak if peak > 0 else 0
                max_drawdown = max(max_drawdown, drawdown)
            
            results[milestone] = {
                'total_signals': total_signals,
                'win_rate': win_rate,
                'total_pnl': total_pnl,
                'avg_pnl_per_trade': avg_pnl,
                'profit_factor': profit_factor,
                'max_drawdown': max_drawdown,
                'target_win_rate': self.target_win_rates[milestone],
                'win_rate_diff': abs(win_rate - self.target_win_rates[milestone])
            }
        
        return results
    
    def optimize_thresholds(self, signals: List[SignalResult], iterations: int = 1000) -> MilestoneThresholds:
        """Use Monte Carlo optimization to find best thresholds"""
        print(f"Optimizing thresholds with {iterations} iterations...")
        
        best_thresholds = MilestoneThresholds()
        best_score = float('inf')
        best_results = None
        
        for i in range(iterations):
            # Generate random thresholds
            thresholds = MilestoneThresholds(
                M1_confidence=random.uniform(0.75, 0.95),
                M1_confirmations=random.randint(2, 5),
                M2_confidence=random.uniform(0.50, 0.75),
                M2_confirmations=random.randint(1, 4),
                M3_confidence=random.uniform(0.30, 0.55),
                M3_confirmations=random.randint(0, 3),
                M4_confidence=0.0,
                M4_confirmations=0
            )
            
            # Ensure thresholds are in descending order
            if (thresholds.M1_confidence <= thresholds.M2_confidence or
                thresholds.M2_confidence <= thresholds.M3_confidence):
                continue
            
            # Calculate performance
            results = self.calculate_milestone_performance(signals, thresholds)
            
            # Calculate optimization score (minimize win rate differences)
            score = sum(results[m]['win_rate_diff'] for m in ['M1', 'M2', 'M3', 'M4'])
            
            # Add penalty for empty milestones
            empty_penalty = sum(10 for m in ['M1', 'M2', 'M3'] if results[m]['total_signals'] == 0)
            score += empty_penalty
            
            if score < best_score:
                best_score = score
                best_thresholds = thresholds
                best_results = results
                
            if (i + 1) % 100 == 0:
                print(f"Iteration {i + 1}/{iterations}, Best score: {best_score:.4f}")
        
        print(f"\nOptimization complete! Best score: {best_score:.4f}")
        return best_thresholds, best_results
    
    def export_results_to_csv(self, signals: List[SignalResult], results: Dict, 
                             filename: str = "milestone_backtest_results.csv"):
        """Export backtest results to CSV"""
        with open(filename, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write summary
            writer.writerow(['Milestone Backtest Results'])
            writer.writerow(['Generated on:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
            writer.writerow(['Total Signals:', len(signals)])
            writer.writerow([])
            
            # Write milestone performance
            writer.writerow(['Milestone', 'Total Signals', 'Win Rate', 'Target Win Rate', 
                           'Win Rate Diff', 'Total P&L', 'Avg P&L', 'Profit Factor', 'Max Drawdown'])
            
            for milestone in ['M1', 'M2', 'M3', 'M4']:
                r = results[milestone]
                writer.writerow([
                    milestone,
                    r['total_signals'],
                    f"{r['win_rate']:.3f}",
                    f"{r['target_win_rate']:.3f}",
                    f"{r['win_rate_diff']:.3f}",
                    f"{r['total_pnl']:.2f}",
                    f"{r['avg_pnl_per_trade']:.2f}",
                    f"{r['profit_factor']:.2f}",
                    f"{r['max_drawdown']:.3f}"
                ])
            
            writer.writerow([])
            
            # Write individual signal data
            writer.writerow(['Signal ID', 'Pair', 'Direction', 'Entry Price', 'Stop Loss', 
                           'Take Profit', 'Confidence Score', 'Secondary Count', 
                           'Assigned Milestone', 'Outcome', 'P&L', 'Timestamp'])
            
            for signal in signals:
                writer.writerow([
                    signal.signal_id,
                    signal.pair,
                    signal.direction,
                    f"{signal.entry_price:.5f}",
                    f"{signal.stop_loss:.5f}",
                    f"{signal.take_profit:.5f}",
                    f"{signal.confidence_score:.3f}",
                    signal.secondary_count,
                    signal.assigned_milestone,
                    signal.outcome,
                    f"{signal.pnl:.2f}",
                    signal.timestamp.strftime('%Y-%m-%d %H:%M:%S')
                ])
        
        print(f"Results exported to {filename}")
    
    def print_results(self, results: Dict, thresholds: MilestoneThresholds):
        """Print formatted results to console"""
        print("\n" + "="*80)
        print("MILESTONE BACKTEST RESULTS")
        print("="*80)
        
        print(f"\nOptimized Thresholds:")
        print(f"M1: Confidence >= {thresholds.M1_confidence:.3f}, Confirmations >= {thresholds.M1_confirmations}")
        print(f"M2: Confidence >= {thresholds.M2_confidence:.3f}, Confirmations >= {thresholds.M2_confirmations}")
        print(f"M3: Confidence >= {thresholds.M3_confidence:.3f}, Confirmations >= {thresholds.M3_confirmations}")
        print(f"M4: All remaining signals")
        
        print(f"\nPerformance by Milestone:")
        print(f"{'Milestone':<10} {'Signals':<8} {'Win Rate':<10} {'Target':<8} {'Diff':<8} {'Total P&L':<12} {'Profit Factor':<12}")
        print("-" * 80)
        
        for milestone in ['M1', 'M2', 'M3', 'M4']:
            r = results[milestone]
            print(f"{milestone:<10} {r['total_signals']:<8} {r['win_rate']:.1%:<10} "
                  f"{r['target_win_rate']:.1%:<8} {r['win_rate_diff']:.1%:<8} "
                  f"{r['total_pnl']:+.2f:<12} {r['profit_factor']:.2f:<12}")
        
        print("\nRecommendations:")
        for milestone in ['M1', 'M2', 'M3', 'M4']:
            r = results[milestone]
            if r['total_signals'] == 0:
                print(f"⚠️  {milestone}: No signals - consider lowering thresholds")
            elif r['win_rate_diff'] > 0.1:
                if r['win_rate'] > r['target_win_rate']:
                    print(f"📈 {milestone}: Win rate too high - consider lowering thresholds")
                else:
                    print(f"📉 {milestone}: Win rate too low - consider raising thresholds")
            else:
                print(f"✅ {milestone}: Win rate within acceptable range")

def main():
    parser = argparse.ArgumentParser(description='Milestone Backtest and Optimization')
    parser.add_argument('--signals', type=int, default=1000, 
                       help='Number of mock signals to generate (default: 1000)')
    parser.add_argument('--iterations', type=int, default=1000,
                       help='Number of optimization iterations (default: 1000)')
    parser.add_argument('--output', type=str, default='milestone_backtest_results.csv',
                       help='Output CSV filename (default: milestone_backtest_results.csv)')
    parser.add_argument('--no-optimize', action='store_true',
                       help='Skip optimization and use default thresholds')
    
    args = parser.parse_args()
    
    backtester = MilestoneBacktester()
    
    print("Generating mock historical data...")
    signals = backtester.generate_mock_historical_data(args.signals)
    
    if args.no_optimize:
        print("Using default thresholds...")
        thresholds = MilestoneThresholds()
        results = backtester.calculate_milestone_performance(signals, thresholds)
    else:
        thresholds, results = backtester.optimize_thresholds(signals, args.iterations)
    
    # Print results
    backtester.print_results(results, thresholds)
    
    # Export to CSV
    backtester.export_results_to_csv(signals, results, args.output)
    
    # Generate configuration for signalScoringService.ts
    config_output = f"""
// Optimized configuration for signalScoringService.ts
// Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

const OPTIMIZED_CONFIG: ScoringConfig = {{
  base_score: 0.5,
  weights: {{
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
  }},
  thresholds: {{
    M1: {{ min_confidence: {thresholds.M1_confidence:.3f}, min_confirmations: {thresholds.M1_confirmations} }},
    M2: {{ min_confidence: {thresholds.M2_confidence:.3f}, min_confirmations: {thresholds.M2_confirmations} }},
    M3: {{ min_confidence: {thresholds.M3_confidence:.3f}, min_confirmations: {thresholds.M3_confirmations} }},
    M4: {{ min_confidence: {thresholds.M4_confidence:.3f}, min_confirmations: {thresholds.M4_confirmations} }}
  }}
}};
"""
    
    with open('optimized_config.ts', 'w') as f:
        f.write(config_output)
    
    print(f"\nOptimized configuration saved to optimized_config.ts")
    print("Copy this configuration to your signalScoringService.ts file")

if __name__ == "__main__":
    main()
