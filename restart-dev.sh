#!/bin/bash

echo "🔄 Restarting development server to apply animation fixes..."

# Stop any running dev server
echo "⏹️  Stopping any running processes on port 5173..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Clear any cached files
echo "🧹 Clearing cache..."
rm -rf node_modules/.vite 2>/dev/null || true

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Start the development server
echo "🚀 Starting development server..."
echo "📱 Open http://localhost:5173/animation-test to test animations"
echo "🏠 Open http://localhost:5173/ to see the main landing page"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
