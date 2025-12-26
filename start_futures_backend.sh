#!/bin/bash

echo "🚀 Starting Futures Trading Backend..."
echo "📦 Installing dependencies..."

# Install Python dependencies
pip install -r requirements.txt

echo "✅ Dependencies installed"
echo "🌐 Starting server on http://localhost:5001"
echo "📊 Futures data available at /api/futures/prices"
echo "🎯 Signal generation at /api/futures/generate-signal"

# Start the futures backend
python simple_realtime_backend.py
