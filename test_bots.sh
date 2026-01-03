#!/bin/bash

# Test Bot System Components
echo "🧪 Testing Bot System Components..."

# Test Python imports
echo "Testing Python imports..."
python3 -c "
try:
    from forex_bot_system import ForexBotSystem
    print('✅ Forex Bot System: OK')
except Exception as e:
    print(f'❌ Forex Bot System: {e}')

try:
    from crypto_trading_bot import CryptoTradingBot
    print('✅ Crypto Trading Bot: OK')
except Exception as e:
    print(f'❌ Crypto Trading Bot: {e}')

try:
    from enhanced_trading_server import app
    print('✅ Enhanced Trading Server: OK')
except Exception as e:
    print(f'❌ Enhanced Trading Server: {e}')
"

# Test database creation
echo ""
echo "Testing database creation..."
python3 -c "
import sqlite3
import os

# Create data directory
os.makedirs('data', exist_ok=True)

# Test trading bots DB
try:
    conn = sqlite3.connect('data/trading_bots.db')
    cursor = conn.cursor()
    cursor.execute('CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY)')
    cursor.execute('DROP TABLE test_table')
    print('✅ Trading Bots DB: OK')
    conn.close()
except Exception as e:
    print(f'❌ Trading Bots DB: {e}')

# Test forex bot DB
try:
    conn = sqlite3.connect('data/forex_bot.db')
    cursor = conn.cursor()
    cursor.execute('CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY)')
    cursor.execute('DROP TABLE test_table')
    print('✅ Forex Bot DB: OK')
    conn.close()
except Exception as e:
    print(f'❌ Forex Bot DB: {e}')

# Test crypto bot DB
try:
    conn = sqlite3.connect('data/crypto_bot.db')
    cursor = conn.cursor()
    cursor.execute('CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY)')
    cursor.execute('DROP TABLE test_table')
    print('✅ Crypto Bot DB: OK')
    conn.close()
except Exception as e:
    print(f'❌ Crypto Bot DB: {e}')
"

# Test basic functionality
echo ""
echo "Testing basic functionality..."
python3 -c "
try:
    # Test forex bot initialization
    from forex_bot_system import ForexBotSystem
    forex_bot = ForexBotSystem('data/test_forex.db')
    print('✅ Forex Bot initialization: OK')
    
    # Test crypto bot initialization
    from crypto_trading_bot import CryptoTradingBot
    crypto_bot = CryptoTradingBot('data/test_crypto.db')
    print('✅ Crypto Bot initialization: OK')
    
    # Clean up test databases
    import os
    os.remove('data/test_forex.db')
    os.remove('data/test_crypto.db')
    
except Exception as e:
    print(f'❌ Basic functionality test: {e}')
"

echo ""
echo "🎉 Bot System testing completed!"
echo ""
echo "💡 If all tests passed, you can start the system with:"
echo "   ./start_bots.sh"
echo ""
echo "💡 Monitor the system with:"
echo "   ./monitor_bots.sh"
