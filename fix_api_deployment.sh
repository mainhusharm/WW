#!/bin/bash
# Deploy the correct API service that matches your database schema
echo "🚀 Deploying Enhanced PostgreSQL API Service"
echo "============================================="

echo "Your database has 'enhanced_users' table, so we need to deploy the enhanced API service."
echo ""

echo "📋 Steps to deploy the correct API service:"
echo ""
echo "1. Update your render.yaml to use enhanced_postgresql_api_routes.py"
echo "2. Or redeploy with the correct service configuration"
echo ""

echo "🔧 Option 1: Quick Fix - Update render.yaml"
echo "Edit your render.yaml file and change:"
echo "   - name: flask-test-app"
echo "   startCommand: python3 enhanced_postgresql_api_routes.py"
echo ""

echo "🔧 Option 2: Manual Redeploy"
echo "If you have access to Render dashboard:"
echo "1. Go to your backend service (flask-test-app)"
echo "2. Change start command to: python3 enhanced_postgresql_api_routes.py"
echo "3. Redeploy the service"
echo ""

echo "✅ After redeployment, your API will work with the existing database!"
echo ""
echo "📊 Expected endpoints after fix:"
echo "   - POST /api/enhanced/signup"
echo "   - POST /api/enhanced/payment"
echo "   - POST /api/enhanced/questionnaire"
echo "   - GET  /api/enhanced/dashboard/<email>"
echo ""
echo "🔍 Test after redeployment:"
echo "curl -s \"https://backend-topb.onrender.com/api/enhanced/health\" | python3 -m json.tool"
