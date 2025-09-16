#!/usr/bin/env python3
"""
Crypto Trading Bot System
Analyzes cryptocurrency data and generates trading signals
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
class CryptoAsset:
    """Cryptocurrency asset data structure"""
    symbol: str
    name: str
    current_price: float
    previous_price: float
    change_percent: float
    market_cap: float
    volume_24h: float
    high_24h: float
    low_24h: float
    circulating_supply: float
    last_updated: datetime

@dataclass
class CryptoSignal:
    """Crypto trading signal data structure"""
    symbol: str
    signal_type: str  # 'buy', 'sell', 'hold'
    confidence: float  # 0.0 to 1.0
    price: float
    timestamp: datetime
    indicators: Dict
    reasoning: str
    risk_level: str

class CryptoTradingBot:
    def __init__(self, db_path: str = 'crypto_bot.db'):
        self.db_path = db_path
        self.crypto_assets = {}
        self.signals = []
        self.config = {
            'min_confidence': 0.75,
            'update_interval': 60,  # seconds
            'max_assets': 100,
            'risk_level': 'medium',
            'stop_loss_percent': 0.05,
            'take_profit_percent': 0.10,
            'max_position_size': 0.1,  # 10% of portfolio
            'volatility_threshold': 0.03  # 3% daily volatility
        }
        self.init_database()
        self.start_monitoring()
    
    def init_database(self):
        """Initialize database for crypto data and signals"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create crypto assets table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS crypto_assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                current_price REAL NOT NULL,
                previous_price REAL,
                change_percent REAL,
                market_cap REAL,
                volume_24h REAL,
                high_24h REAL,
                low_24h REAL,
                circulating_supply REAL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create crypto signals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS crypto_signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                signal_type TEXT NOT NULL,
                confidence REAL NOT NULL,
                price REAL NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                indicators TEXT,
                reasoning TEXT,
                risk_level TEXT,
                status TEXT DEFAULT 'active'
            )
        ''')
        
        # Create price history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS crypto_price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                price REAL NOT NULL,
                volume REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create portfolio table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS crypto_portfolio (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                quantity REAL NOT NULL,
                avg_price REAL NOT NULL,
                current_value REAL,
                pnl REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Crypto trading bot database initialized")
    
    def add_crypto_asset(self, asset: CryptoAsset):
        """Add or update a cryptocurrency asset"""
        self.crypto_assets[asset.symbol] = asset
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO crypto_assets 
            (symbol, name, current_price, previous_price, change_percent, 
             market_cap, volume_24h, high_24h, low_24h, circulating_supply, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (asset.symbol, asset.name, asset.current_price, asset.previous_price,
              asset.change_percent, asset.market_cap, asset.volume_24h,
              asset.high_24h, asset.low_24h, asset.circulating_supply,
              asset.last_updated.isoformat()))
        
        # Add to price history
        cursor.execute('''
            INSERT INTO crypto_price_history (symbol, price, volume, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (asset.symbol, asset.current_price, asset.volume_24h, asset.last_updated.isoformat()))
        
        conn.commit()
        conn.close()
    
    def get_crypto_asset(self, symbol: str) -> Optional[CryptoAsset]:
        """Get crypto asset by symbol"""
        return self.crypto_assets.get(symbol)
    
    def get_all_assets(self) -> List[CryptoAsset]:
        """Get all crypto assets"""
        return list(self.crypto_assets.values())
    
    def analyze_asset(self, symbol: str) -> Optional[CryptoSignal]:
        """Analyze a cryptocurrency asset and generate trading signal"""
        asset = self.get_crypto_asset(symbol)
        if not asset:
            return None
        
        # Get price history for analysis
        prices = self.get_price_history(symbol, limit=100)
        if len(prices) < 20:
            return None
        
        # Calculate technical indicators
        indicators = self.calculate_indicators(prices)
        
        # Generate signal based on indicators
        signal = self.generate_signal(symbol, asset, indicators)
        
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
        sma_200 = np.mean(prices_array[-200:]) if len(prices) >= 200 else sma_50
        
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
        
        # Volume analysis
        volume_sma = np.mean(prices_array[-20:]) if len(prices) >= 20 else prices_array[-1]
        
        # Volatility calculation
        returns = np.diff(np.log(prices_array))
        volatility = np.std(returns) * np.sqrt(252)  # Annualized volatility
        
        return {
            'sma_20': float(sma_20),
            'sma_50': float(sma_50),
            'sma_200': float(sma_200),
            'ema_12': float(ema_12),
            'ema_26': float(ema_26),
            'rsi': float(rsi),
            'macd': float(macd_line),
            'macd_signal': float(signal_line),
            'bb_upper': float(bb_upper),
            'bb_lower': float(bb_lower),
            'current_price': float(prices[-1]),
            'volume_sma': float(volume_sma),
            'volatility': float(volatility)
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
    
    def generate_signal(self, symbol: str, asset: CryptoAsset, indicators: Dict) -> Optional[CryptoSignal]:
        """Generate trading signal based on indicators"""
        if not indicators:
            return None
        
        signal_type = 'hold'
        confidence = 0.5
        reasoning = []
        risk_level = 'medium'
        
        # RSI analysis
        rsi = indicators.get('rsi', 50)
        if rsi < 25:
            signal_type = 'buy'
            confidence += 0.25
            reasoning.append(f"RSI extremely oversold ({rsi:.1f})")
        elif rsi < 30:
            signal_type = 'buy'
            confidence += 0.15
            reasoning.append(f"RSI oversold ({rsi:.1f})")
        elif rsi > 75:
            signal_type = 'sell'
            confidence += 0.25
            reasoning.append(f"RSI extremely overbought ({rsi:.1f})")
        elif rsi > 70:
            signal_type = 'sell'
            confidence += 0.15
            reasoning.append(f"RSI overbought ({rsi:.1f})")
        
        # Moving average analysis
        current_price = indicators.get('current_price', asset.current_price)
        sma_20 = indicators.get('sma_20', current_price)
        sma_50 = indicators.get('sma_50', current_price)
        sma_200 = indicators.get('sma_200', current_price)
        
        # Golden Cross (SMA 20 > SMA 50)
        if sma_20 > sma_50 and signal_type == 'buy':
            confidence += 0.15
            reasoning.append("Golden Cross (SMA 20 > SMA 50)")
        
        # Death Cross (SMA 20 < SMA 50)
        if sma_20 < sma_50 and signal_type == 'sell':
            confidence += 0.15
            reasoning.append("Death Cross (SMA 20 < SMA 50)")
        
        # Price above/below 200 SMA
        if current_price > sma_200 and signal_type == 'buy':
            confidence += 0.1
            reasoning.append("Price above 200 SMA (bullish trend)")
        elif current_price < sma_200 and signal_type == 'sell':
            confidence += 0.1
            reasoning.append("Price below 200 SMA (bearish trend)")
        
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
        
        # Volatility analysis
        volatility = indicators.get('volatility', 0)
        if volatility > self.config['volatility_threshold']:
            risk_level = 'high'
            reasoning.append(f"High volatility ({volatility:.2%})")
        elif volatility < self.config['volatility_threshold'] * 0.5:
            risk_level = 'low'
            reasoning.append(f"Low volatility ({volatility:.2%})")
        
        # Volume analysis
        if asset.volume_24h > asset.market_cap * 0.1:  # High volume relative to market cap
            confidence += 0.05
            reasoning.append("High trading volume")
        
        # Market cap analysis
        if asset.market_cap > 10000000000:  # > $10B
            confidence += 0.05
            reasoning.append("Large market cap (established)")
        elif asset.market_cap < 100000000:  # < $100M
            risk_level = 'high'
            reasoning.append("Small market cap (risky)")
        
        # Cap confidence at 1.0
        confidence = min(confidence, 1.0)
        
        if signal_type == 'hold' or confidence < self.config['min_confidence']:
            return None
        
        return CryptoSignal(
            symbol=symbol,
            signal_type=signal_type,
            confidence=confidence,
            price=current_price,
            timestamp=datetime.now(),
            indicators=indicators,
            reasoning="; ".join(reasoning),
            risk_level=risk_level
        )
    
    def add_signal(self, signal: CryptoSignal):
        """Add a new trading signal"""
        self.signals.append(signal)
        
        # Save to database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO crypto_signals 
            (symbol, signal_type, confidence, price, indicators, reasoning, risk_level)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (signal.symbol, signal.signal_type, signal.confidence, signal.price,
              json.dumps(signal.indicators), signal.reasoning, signal.risk_level))
        
        conn.commit()
        conn.close()
        
        logger.info(f"New crypto signal: {signal.signal_type.upper()} {signal.symbol} "
                   f"(confidence: {signal.confidence:.2f}, risk: {signal.risk_level})")
    
    def get_signals(self, limit: int = 50) -> List[CryptoSignal]:
        """Get recent trading signals"""
        return sorted(self.signals, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def get_price_history(self, symbol: str, limit: int = 100) -> List[float]:
        """Get price history for a symbol"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT price FROM crypto_price_history 
            WHERE symbol = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (symbol, limit))
        
        prices = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        return prices[::-1]  # Return in chronological order
    
    def start_monitoring(self):
        """Start background monitoring thread"""
        def monitor_crypto():
            while True:
                try:
                    # Analyze all assets
                    for symbol in self.crypto_assets:
                        self.analyze_asset(symbol)
                    
                    time.sleep(self.config['update_interval'])
                except Exception as e:
                    logger.error(f"Error in crypto monitoring: {e}")
                    time.sleep(self.config['update_interval'])
        
        thread = threading.Thread(target=monitor_crypto, daemon=True)
        thread.start()
        logger.info("Crypto monitoring thread started")
    
    def update_crypto_data(self, crypto_data: List[Dict]):
        """Update crypto data from external source"""
        for data in crypto_data:
            try:
                asset = CryptoAsset(
                    symbol=data.get('symbol', ''),
                    name=data.get('name', ''),
                    current_price=float(data.get('price', 0)),
                    previous_price=float(data.get('previous_price', 0)),
                    change_percent=float(data.get('change_percent', 0)),
                    market_cap=float(data.get('market_cap', 0)),
                    volume_24h=float(data.get('volume_24h', 0)),
                    high_24h=float(data.get('high_24h', 0)),
                    low_24h=float(data.get('low_24h', 0)),
                    circulating_supply=float(data.get('circulating_supply', 0)),
                    last_updated=datetime.now()
                )
                
                if asset.symbol:
                    self.add_crypto_asset(asset)
                    
            except Exception as e:
                logger.error(f"Error processing crypto data: {e}")
    
    def get_system_status(self) -> Dict:
        """Get system status"""
        return {
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'crypto_assets_count': len(self.crypto_assets),
            'active_signals': len([s for s in self.signals if s.timestamp > datetime.now() - timedelta(hours=24)]),
            'total_signals': len(self.signals),
            'config': self.config
        }
    
    def get_portfolio_summary(self) -> Dict:
        """Get portfolio summary"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT symbol, quantity, avg_price, current_value, pnl
            FROM crypto_portfolio
        ''')
        
        portfolio = []
        total_value = 0
        total_pnl = 0
        
        for row in cursor.fetchall():
            symbol, quantity, avg_price, current_value, pnl = row
            portfolio.append({
                'symbol': symbol,
                'quantity': quantity,
                'avg_price': avg_price,
                'current_value': current_value,
                'pnl': pnl
            })
            total_value += current_value or 0
            total_pnl += pnl or 0
        
        conn.close()
        
        return {
            'portfolio': portfolio,
            'total_value': total_value,
            'total_pnl': total_pnl,
            'total_assets': len(portfolio)
        }

# Example usage and testing
if __name__ == '__main__':
    # Initialize the crypto trading bot
    crypto_bot = CryptoTradingBot()
    
    # Example crypto data
    sample_data = [
        {
            'symbol': 'BTC',
            'name': 'Bitcoin',
            'price': 45000.0,
            'previous_price': 44000.0,
            'change_percent': 2.27,
            'market_cap': 850000000000,
            'volume_24h': 25000000000,
            'high_24h': 46000.0,
            'low_24h': 43500.0,
            'circulating_supply': 19000000
        },
        {
            'symbol': 'ETH',
            'name': 'Ethereum',
            'price': 3200.0,
            'previous_price': 3150.0,
            'change_percent': 1.59,
            'market_cap': 380000000000,
            'volume_24h': 15000000000,
            'high_24h': 3250.0,
            'low_24h': 3100.0,
            'circulating_supply': 120000000
        }
    ]
    
    # Update with sample data
    crypto_bot.update_crypto_data(sample_data)
    
    # Wait for analysis
    time.sleep(5)
    
    # Get status and signals
    status = crypto_bot.get_system_status()
    signals = crypto_bot.get_signals()
    
    print("Crypto Trading Bot Status:")
    print(json.dumps(status, indent=2, default=str))
    
    print("\nRecent Signals:")
    for signal in signals:
        print(f"{signal.symbol}: {signal.signal_type.upper()} "
              f"(confidence: {signal.confidence:.2f}, risk: {signal.risk_level}) - {signal.reasoning}")
