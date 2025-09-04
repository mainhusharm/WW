#!/bin/bash

echo "🚀 Deploying Updated YFinance Service to Render..."

# Navigate to yfinance-service directory
cd yfinance-service

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Please run this script from the project root."
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "📋 Files to deploy:"
ls -la

echo ""
echo "🔧 Key Updates Made:"
echo "✅ Added CORS support for frontend-01uh.onrender.com"
echo "✅ Fixed forex symbol formatting for Yahoo Finance API"
echo "✅ Added preflight request handling"
echo "✅ Improved error handling and fallback data"

echo ""
echo "📤 Ready to deploy to Render..."
echo "Please ensure you have:"
echo "1. Connected this repository to your Render account"
echo "2. Created a web service for the yfinance-service folder"
echo "3. Set the build command to: npm install"
echo "4. Set the start command to: npm start"

echo ""
echo "🔄 The service will automatically deploy when you push these changes to your repository."
echo "📊 After deployment, test the endpoints:"
echo "   - Health: https://your-service-name.onrender.com/health"
echo "   - Single Price: https://your-service-name.onrender.com/api/price/EUR/USD"
echo "   - Bulk: POST to https://your-service-name.onrender.com/api/bulk"

echo ""
echo "🎯 Next Steps:"
echo "1. Commit and push these changes:"
echo "   git add ."
echo "   git commit -m 'Fix CORS and forex symbol handling in yfinance service'"
echo "   git push"
echo ""
echo "2. Monitor the deployment in your Render dashboard"
echo "3. Test the endpoints once deployed"
echo "4. Update your frontend API config if the service URL changes"

echo ""
echo "✅ Deployment script completed!"
