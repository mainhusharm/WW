#!/usr/bin/env python3
"""
Database initialization script for Trading Journal
"""

import sqlite3
import os
from datetime import datetime

def create_database():
    """Create the SQLite database and tables"""
    
    # Create database directory if it doesn't exist
    os.makedirs('instance', exist_ok=True)
    
    # Connect to database (creates it if it doesn't exist)
    conn = sqlite3.connect('instance/trading_journal.db')
    cursor = conn.cursor()
    
    print("Creating database tables...")
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(80) UNIQUE NOT NULL,
            email VARCHAR(120) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            role VARCHAR(20) DEFAULT 'user'
        )
    ''')
    
    # Trades table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            side VARCHAR(10) NOT NULL,
            quantity DECIMAL(15,8) NOT NULL,
            entry_price DECIMAL(15,8) NOT NULL,
            exit_price DECIMAL(15,8),
            entry_time TIMESTAMP NOT NULL,
            exit_time TIMESTAMP,
            pnl DECIMAL(15,8),
            pnl_percent DECIMAL(10,4),
            status VARCHAR(20) DEFAULT 'open',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Signals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol VARCHAR(20) NOT NULL,
            type VARCHAR(10) NOT NULL,
            strength VARCHAR(20) NOT NULL,
            timeframe VARCHAR(10) NOT NULL,
            price DECIMAL(15,8) NOT NULL,
            target_price DECIMAL(15,8),
            stop_loss DECIMAL(15,8),
            confidence INTEGER,
            source VARCHAR(100),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Price data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS price_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol VARCHAR(20) NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            open DECIMAL(15,8) NOT NULL,
            high DECIMAL(15,8) NOT NULL,
            low DECIMAL(15,8) NOT NULL,
            close DECIMAL(15,8) NOT NULL,
            volume DECIMAL(20,8),
            timeframe VARCHAR(10) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(symbol, timestamp, timeframe)
        )
    ''')
    
    # Risk rules table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS risk_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            risk_level VARCHAR(20) NOT NULL,
            category VARCHAR(50) NOT NULL,
            parameters TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Trading bots table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trading_bots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            strategy VARCHAR(100) NOT NULL,
            symbols TEXT NOT NULL,
            risk_level VARCHAR(20) NOT NULL,
            settings TEXT,
            status VARCHAR(20) DEFAULT 'stopped',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Forex pairs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS forex_pairs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            base_currency VARCHAR(10) NOT NULL,
            quote_currency VARCHAR(10) NOT NULL,
            symbol VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            category VARCHAR(20) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes for better performance
    print("Creating indexes...")
    
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_signals_active ON signals(is_active)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_price_data_symbol ON price_data(symbol)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_price_data_timestamp ON price_data(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_risk_rules_active ON risk_rules(is_active)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_trading_bots_active ON trading_bots(is_active)')
    
    # Insert sample data
    print("Inserting sample data...")
    
    # Sample forex pairs
    sample_pairs = [
        ('EUR', 'USD', 'EUR/USD', 'Euro / US Dollar', 'major'),
        ('GBP', 'USD', 'GBP/USD', 'British Pound / US Dollar', 'major'),
        ('USD', 'JPY', 'USD/JPY', 'US Dollar / Japanese Yen', 'major'),
        ('USD', 'CHF', 'USD/CHF', 'US Dollar / Swiss Franc', 'major'),
        ('AUD', 'USD', 'AUD/USD', 'Australian Dollar / US Dollar', 'major'),
        ('USD', 'CAD', 'USD/CAD', 'US Dollar / Canadian Dollar', 'major'),
        ('NZD', 'USD', 'NZD/USD', 'New Zealand Dollar / US Dollar', 'major')
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO forex_pairs (base_currency, quote_currency, symbol, name, category)
        VALUES (?, ?, ?, ?, ?)
    ''', sample_pairs)
    
    # Sample risk rules
    sample_rules = [
        ('Position Size Limit', 'Maximum position size as percentage of portfolio', 'high', 'position-sizing', '{"maxPositionSize": 0.05, "maxPortfolioRisk": 0.02}'),
        ('Stop Loss Enforcement', 'Automatic stop loss based on volatility', 'medium', 'stop-loss', '{"atrMultiplier": 2, "maxLoss": 0.03}'),
        ('Correlation Check', 'Prevent over-exposure to correlated assets', 'medium', 'correlation', '{"maxCorrelation": 0.7, "maxExposure": 0.15}')
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO risk_rules (name, description, risk_level, category, parameters)
        VALUES (?, ?, ?, ?, ?)
    ''', sample_rules)
    
    # Sample trading bots
    sample_bots = [
        ('SMC Momentum Bot', 'Momentum Breakout', '["BTC/USDT", "ETH/USDT"]', 'medium', '{"maxPositionSize": 0.05, "stopLoss": 0.03, "takeProfit": 0.06}'),
        ('Mean Reversion Bot', 'Mean Reversion', '["ADA/USDT", "DOT/USDT"]', 'low', '{"maxPositionSize": 0.03, "stopLoss": 0.02, "takeProfit": 0.04}'),
        ('Grid Trading Bot', 'Grid Trading', '["BTC/USDT"]', 'high', '{"maxPositionSize": 0.08, "stopLoss": 0.05, "takeProfit": 0.08}')
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO trading_bots (name, strategy, symbols, risk_level, settings)
        VALUES (?, ?, ?, ?, ?)
    ''', sample_bots)
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print("Database initialization completed successfully!")
    print(f"Database created at: {os.path.abspath('instance/trading_journal.db')}")

def verify_database():
    """Verify that the database was created correctly"""
    
    if not os.path.exists('instance/trading_journal.db'):
        print("Error: Database file not found!")
        return False
    
    conn = sqlite3.connect('instance/trading_journal.db')
    cursor = conn.cursor()
    
    # Check tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    expected_tables = [
        'users', 'trades', 'signals', 'price_data', 
        'risk_rules', 'trading_bots', 'forex_pairs'
    ]
    
    missing_tables = set(expected_tables) - set(tables)
    
    if missing_tables:
        print(f"Warning: Missing tables: {missing_tables}")
        return False
    
    # Check sample data
    cursor.execute("SELECT COUNT(*) FROM forex_pairs")
    pair_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM risk_rules")
    rule_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM trading_bots")
    bot_count = cursor.fetchone()[0]
    
    print(f"Database verification:")
    print(f"  - Tables: {len(tables)}")
    print(f"  - Forex pairs: {pair_count}")
    print(f"  - Risk rules: {rule_count}")
    print(f"  - Trading bots: {bot_count}")
    
    conn.close()
    return True

if __name__ == '__main__':
    try:
        create_database()
        verify_database()
        print("\nDatabase setup completed successfully!")
    except Exception as e:
        print(f"Error during database setup: {e}")
        exit(1)
