#!/bin/bash

echo "🚀 Starting yfinance API Service..."
echo "📍 Port: 5002"
echo "🔗 Endpoint: http://localhost:5002/get_futures_prices"
echo ""

# Navigate to yfinance service directory
cd yfinance-service

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python3 first."
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 not found. Please install pip3 first."
    exit 1
fi

# Install requirements if needed
echo "📦 Installing requirements..."
pip3 install -r requirements.txt

# Start the service
echo "🌟 Starting yfinance service on port 5002..."
python3 app.py
