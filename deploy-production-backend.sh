#!/bin/bash

# Deploy Production Backend Script
echo "🚀 Deploying Production Backend for TraderEdge Pro..."

# Check if we're in the right directory
if [ ! -f "production-backend.js" ]; then
    echo "❌ Error: production-backend.js not found. Please run from project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing production dependencies..."
npm install express cors

# Test the backend locally first
echo "🧪 Testing backend locally..."
node production-backend.js &
BACKEND_PID=$!

# Wait a moment for the server to start
sleep 3

# Test the health endpoint
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend test successful!"
else
    echo "❌ Backend test failed!"
    kill $BACKEND_PID
    exit 1
fi

# Stop the test server
kill $BACKEND_PID

echo "✅ Production backend is ready for deployment!"
echo "📋 Next steps:"
echo "   1. Deploy production-backend.js to your production server"
echo "   2. Install dependencies: npm install express cors"
echo "   3. Start with: node production-backend.js"
echo "   4. Ensure the server is accessible at https://www.traderedgepro.com"

echo "🎉 Deployment script completed!"
