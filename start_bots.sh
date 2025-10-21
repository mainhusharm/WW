#!/bin/bash

# Start Trading Bot System
echo "🤖 Starting Trading Bot System..."

# Set environment
export FLASK_ENV=production
export FLASK_APP=enhanced_trading_server.py

# Create necessary directories
mkdir -p data
mkdir -p logs
mkdir -p config

# Check if Python dependencies are installed
echo "📦 Checking dependencies..."
if ! python3 -c "import numpy, pandas, requests, flask" 2>/dev/null; then
    echo "❌ Missing dependencies. Installing..."
    pip install -r requirements-bots.txt
fi

# Start the enhanced trading server
echo "🚀 Starting Enhanced Trading Server..."
python3 enhanced_trading_server.py &

# Wait a moment for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Enhanced Trading Server is running"
    echo "📊 Dashboard: http://localhost:5000"
    echo "🔍 Health Check: http://localhost:5000/health"
else
    echo "❌ Failed to start Enhanced Trading Server"
    echo "📝 Check logs for errors"
    exit 1
fi

echo "🎉 Bot System is now running!"
echo "💡 Use ./monitor_bots.sh to check status"
echo "💡 Use ./test_bots.sh to test components"

# Keep script running and show logs
echo "📝 Showing logs (Ctrl+C to stop)..."
tail -f logs/bot_system.log 2>/dev/null || echo "No log file found yet"
