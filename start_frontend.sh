#!/bin/bash
echo "🚀 Starting TraderEdgePro Frontend Server..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start frontend server
npm run dev
