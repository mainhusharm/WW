#!/usr/bin/env python3
"""
Forex Bot System
Analyzes forex data and generates trading signals
"""

import os
import json
import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import requests
import sqlite3
import numpy as np
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ForexPair:
    """Forex pair data structure"""
    symbol: str
    base_currency: str
    quote_currency: str
    current_rate: float
    previous_rate: float
    change_percent: float
    high_24h: float
    low_24h: float
    volume_24h: float
    last_updated: datetime

@dataclass
class TradingSignal:
    """Trading signal data structure"""
    symbol: str
    signal_type: str  # 'buy', 'sell', 'hold'
    confidence: float  # 0.0 to 1.0
    price: float
    timestamp: datetime
    indicators: Dict
    reasoning: str

class ForexBotSystem:
    def __init__(self, db_path: str = 'forex_bot.db'):
        self.db_path = db_path
        self.forex_pairs = {}
        self.signals = []
        self.config = {
            'min_confidence': 0.7,
            'update_interval': 30,  # seconds
            'max_pairs': 50,
            'risk_level': 'medium',
            'stop_loss_percent': 0.02,
            'take_profit_percent': 0.04
        }
        self.init_database()
        self.start_monitoring()
    
    def init_database(self):
        """Initialize database for forex data and signals"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create forex pairs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS forex_pairs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT UNIQUE NOT NULL,
                base_currency TEXT NOT NULL,
                quote_currency TEXT NOT NULL,
                current_rate REAL NOT NULL,
                previous_rate REAL,
                change_percent REAL,
                high_24h REAL,
                low_24h REAL,
                volume_24h REAL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create trading signals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS forex_signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                signal_type TEXT NOT NULL,
                confidence REAL NOT NULL,
                price REAL NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                indicators TEXT,
                reasoning TEXT,
                status TEXT DEFAULT 'active'
            )
        ''')
        
        # Create price history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                price REAL NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Forex bot database initialized")
    
    def add_forex_pair(self, pair: ForexPair):
        """Add or update a forex pair"""
        self.forex_pairs[pair.symbol] = pair
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO forex_pairs 
            (symbol, base_currency, quote_currency, current_rate, previous_rate, 
             change_percent, high_24h, low_24h, volume_24h, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (pair.symbol, pair.base_currency, pair.quote_currency, pair.current_rate,
              pair.previous_rate, pair.change_percent, pair.high_24h, pair.low_24h,
              pair.volume_24h, pair.last_updated.isoformat()))
        
        # Add to price history
        cursor.execute('''
            INSERT INTO price_history (symbol, price, timestamp)
            VALUES (?, ?, ?)
        ''', (pair.symbol, pair.current_rate, pair.last_updated.isoformat()))
        
        conn.commit()
        conn.close()
    
    def get_forex_pair(self, symbol: str) -> Optional[ForexPair]:
        """Get forex pair by symbol"""
        return self.forex_pairs.get(symbol)
    
    def get_all_pairs(self) -> List[ForexPair]:
        """Get all forex pairs"""
        return list(self.forex_pairs.values())
    
    def analyze_pair(self, symbol: str) -> Optional[TradingSignal]:
        """Analyze a forex pair and generate trading signal"""
        pair = self.get_forex_pair(symbol)
        if not pair:
            return None
        
        # Get price history for analysis
        prices = self.get_price_history(symbol, limit=100)
        if len(prices) < 20:
            return None
        
        # Calculate technical indicators
        indicators = self.calculate_indicators(prices)
        
        # Generate signal based on indicators
        signal = self.generate_signal(symbol, pair, indicators)
        
        if signal and signal.confidence >= self.config['min_confidence']:
            self.add_signal(signal)
            return signal
        
        return None
    
    def calculate_indicators(self, prices: List[float]) -> Dict:
        """Calculate technical indicators from price data"""
        if len(prices) < 20:
            return {}
        
        prices_array = np.array(prices)
        
        # Simple Moving Averages
        sma_20 = np.mean(prices_array[-20:])
        sma_50 = np.mean(prices_array[-50:]) if len(prices) >= 50 else sma_20
        
        # Exponential Moving Averages
        ema_12 = self.calculate_ema(prices_array, 12)
        ema_26 = self.calculate_ema(prices_array, 26)
        
        # RSI
        rsi = self.calculate_rsi(prices_array)
        
        # MACD
        macd_line = ema_12 - ema_26
        signal_line = self.calculate_ema(np.array([macd_line]), 9)[0] if len(prices) >= 35 else 0
        
        # Bollinger Bands
        bb_upper, bb_lower = self.calculate_bollinger_bands(prices_array, 20)
        
        return {
            'sma_20': float(sma_20),
            'sma_50': float(sma_50),
            'ema_12': float(ema_12),
            'ema_26': float(ema_26),
            'rsi': float(rsi),
            'macd': float(macd_line),
            'macd_signal': float(signal_line),
            'bb_upper': float(bb_upper),
            'bb_lower': float(bb_lower),
            'current_price': float(prices[-1])
        }
    
    def calculate_ema(self, prices: np.ndarray, period: int) -> float:
        """Calculate Exponential Moving Average"""
        if len(prices) < period:
            return float(prices[-1])
        
        alpha = 2 / (period + 1)
        ema = prices[0]
        
        for price in prices[1:]:
            ema = alpha * price + (1 - alpha) * ema
        
        return ema
    
    def calculate_rsi(self, prices: np.ndarray, period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return 50.0
        
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def calculate_bollinger_bands(self, prices: np.ndarray, period: int = 20) -> Tuple[float, float]:
        """Calculate Bollinger Bands"""
        if len(prices) < period:
            return prices[-1], prices[-1]
        
        sma = np.mean(prices[-period:])
        std = np.std(prices[-period:])
        
        upper_band = sma + (2 * std)
        lower_band = sma - (2 * std)
        
        return upper_band, lower_band
    
    def generate_signal(self, symbol: str, pair: ForexPair, indicators: Dict) -> Optional[TradingSignal]:
        """Generate trading signal based on indicators"""
        if not indicators:
            return None
        
        signal_type = 'hold'
        confidence = 0.5
        reasoning = []
        
        # RSI analysis
        rsi = indicators.get('rsi', 50)
        if rsi < 30:
            signal_type = 'buy'
            confidence += 0.2
            reasoning.append(f"RSI oversold ({rsi:.1f})")
        elif rsi > 70:
            signal_type = 'sell'
            confidence += 0.2
            reasoning.append(f"RSI overbought ({rsi:.1f})")
        
        # Moving average analysis
        current_price = indicators.get('current_price', pair.current_rate)
        sma_20 = indicators.get('sma_20', current_price)
        sma_50 = indicators.get('sma_50', current_price)
        
        if current_price > sma_20 > sma_50:
            if signal_type == 'buy':
                confidence += 0.15
            reasoning.append("Price above moving averages")
        elif current_price < sma_20 < sma_50:
            if signal_type == 'sell':
                confidence += 0.15
            reasoning.append("Price below moving averages")
        
        # MACD analysis
        macd = indicators.get('macd', 0)
        macd_signal = indicators.get('macd_signal', 0)
        
        if macd > macd_signal and signal_type == 'buy':
            confidence += 0.1
            reasoning.append("MACD bullish crossover")
        elif macd < macd_signal and signal_type == 'sell':
            confidence += 0.1
            reasoning.append("MACD bearish crossover")
        
        # Bollinger Bands analysis
        bb_upper = indicators.get('bb_upper', current_price)
        bb_lower = indicators.get('bb_lower', current_price)
        
        if current_price <= bb_lower and signal_type == 'buy':
            confidence += 0.1
            reasoning.append("Price at lower Bollinger Band")
        elif current_price >= bb_upper and signal_type == 'sell':
            confidence += 0.1
            reasoning.append("Price at upper Bollinger Band")
        
        # Trend strength
        if abs(pair.change_percent) > 1.0:
            confidence += 0.05
            reasoning.append("Strong price movement")
        
        # Cap confidence at 1.0
        confidence = min(confidence, 1.0)
        
        if signal_type == 'hold' or confidence < self.config['min_confidence']:
            return None
        
        return TradingSignal(
            symbol=symbol,
            signal_type=signal_type,
            confidence=confidence,
            price=current_price,
            timestamp=datetime.now(),
            indicators=indicators,
            reasoning="; ".join(reasoning)
        )
    
    def add_signal(self, signal: TradingSignal):
        """Add a new trading signal"""
        self.signals.append(signal)
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO forex_signals 
            (symbol, signal_type, confidence, price, indicators, reasoning)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (signal.symbol, signal.signal_type, signal.confidence, signal.price,
              json.dumps(signal.indicators), signal.reasoning))
        
        conn.commit()
        conn.close()
        
        logger.info(f"New signal: {signal.signal_type.upper()} {signal.symbol} "
                   f"(confidence: {signal.confidence:.2f})")
    
    def get_signals(self, limit: int = 50) -> List[TradingSignal]:
        """Get recent trading signals"""
        return sorted(self.signals, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def get_price_history(self, symbol: str, limit: int = 100) -> List[float]:
        """Get price history for a symbol"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT price FROM price_history 
            WHERE symbol = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (symbol, limit))
        
        prices = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        return prices[::-1]  # Return in chronological order
    
    def start_monitoring(self):
        """Start background monitoring thread"""
        def monitor_forex():
            while True:
                try:
                    # Analyze all pairs
                    for symbol in self.forex_pairs:
                        self.analyze_pair(symbol)
                    
                    time.sleep(self.config['update_interval'])
                except Exception as e:
                    logger.error(f"Error in forex monitoring: {e}")
                    time.sleep(self.config['update_interval'])
        
        thread = threading.Thread(target=monitor_forex, daemon=True)
        thread.start()
        logger.info("Forex monitoring thread started")
    
    def update_forex_data(self, forex_data: List[Dict]):
        """Update forex data from external source"""
        for data in forex_data:
            try:
                pair = ForexPair(
                    symbol=data.get('symbol', ''),
                    base_currency=data.get('base_currency', ''),
                    quote_currency=data.get('quote_currency', ''),
                    current_rate=float(data.get('rate', 0)),
                    previous_rate=float(data.get('previous_rate', 0)),
                    change_percent=float(data.get('change_percent', 0)),
                    high_24h=float(data.get('high_24h', 0)),
                    low_24h=float(data.get('low_24h', 0)),
                    volume_24h=float(data.get('volume_24h', 0)),
                    last_updated=datetime.now()
                )
                
                if pair.symbol:
                    self.add_forex_pair(pair)
                    
            except Exception as e:
                logger.error(f"Error processing forex data: {e}")
    
    def get_system_status(self) -> Dict:
        """Get system status"""
        return {
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'forex_pairs_count': len(self.forex_pairs),
            'active_signals': len([s for s in self.signals if s.timestamp > datetime.now() - timedelta(hours=24)]),
            'total_signals': len(self.signals),
            'config': self.config
        }

# Example usage and testing
if __name__ == '__main__':
    # Initialize the forex bot system
    forex_bot = ForexBotSystem()
    
    # Example forex data
    sample_data = [
        {
            'symbol': 'EUR/USD',
            'base_currency': 'EUR',
            'quote_currency': 'USD',
            'rate': 1.0850,
            'previous_rate': 1.0840,
            'change_percent': 0.09,
            'high_24h': 1.0870,
            'low_24h': 1.0830,
            'volume_24h': 1000000
        },
        {
            'symbol': 'GBP/USD',
            'base_currency': 'GBP',
            'quote_currency': 'USD',
            'rate': 1.2650,
            'previous_rate': 1.2660,
            'change_percent': -0.08,
            'high_24h': 1.2680,
            'low_24h': 1.2640,
            'volume_24h': 800000
        }
    ]
    
    # Update with sample data
    forex_bot.update_forex_data(sample_data)
    
    # Wait for analysis
    time.sleep(5)
    
    # Get status and signals
    status = forex_bot.get_system_status()
    signals = forex_bot.get_signals()
    
    print("Forex Bot System Status:")
    print(json.dumps(status, indent=2, default=str))
    
    print("\nRecent Signals:")
    for signal in signals:
        print(f"{signal.symbol}: {signal.signal_type.upper()} "
              f"(confidence: {signal.confidence:.2f}) - {signal.reasoning}")
