#!/bin/bash

echo "🚀 Starting Customer Service Dashboard Data Flow Test"
echo "=================================================="

# Check if server is running
echo "⏳ Checking if development server is running..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Server is running at http://localhost:5173"
else
    echo "❌ Server not running. Starting development server..."
    npm run dev &
    sleep 5
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Server started successfully at http://localhost:5173"
    else
        echo "❌ Failed to start server. Please run 'npm run dev' manually"
        exit 1
    fi
fi

echo ""
echo "📋 Testing Instructions:"
echo "========================"
echo ""
echo "1. Open your browser and go to: http://localhost:5173"
echo ""
echo "2. Test User 1 - Conservative Trader:"
echo "   - Email: conservative.trader@test.com"
echo "   - Password: TestPass123!"
echo "   - Prop Firm: FTMO, Account Size: $10,000, Risk: 0.5%"
echo ""
echo "3. Test User 2 - Aggressive Trader:"
echo "   - Email: aggressive.trader@test.com" 
echo "   - Password: TestPass123!"
echo "   - Prop Firm: MyForexFunds, Account Size: $100,000, Risk: 3%"
echo ""
echo "4. Test User 3 - Moderate Trader:"
echo "   - Email: moderate.trader@test.com"
echo "   - Password: TestPass123!"
echo "   - Prop Firm: TopStep, Account Size: $25,000, Risk: 1.5%"
echo ""
echo "5. After creating each user and completing questionnaires:"
echo "   - Go to Customer Service Dashboard"
echo "   - Select each user and verify they show DIFFERENT data"
echo "   - Each user should show their specific questionnaire responses"
echo ""
echo "✅ Expected Result: Each user shows unique data, no static data"
echo "❌ Problem: All users show identical data (static data issue)"
echo ""
echo "📖 For detailed instructions, see: TESTING_GUIDE.md"
echo "🧪 For test simulation, run: node test-complete-data-flow.js"
echo ""

# Open browser if possible
if command -v open > /dev/null; then
    echo "🌐 Opening browser..."
    open http://localhost:5173
elif command -v xdg-open > /dev/null; then
    echo "🌐 Opening browser..."
    xdg-open http://localhost:5173
else
    echo "🌐 Please manually open http://localhost:5173 in your browser"
fi
