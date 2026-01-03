#!/bin/bash
# Check if service exists and create if needed
echo "🔍 Checking Service Status"
echo "=========================="

echo "1. Testing if backend service exists..."
curl -s -I "https://backend-topb.onrender.com/api/health" | head -3

echo ""
echo "2. If you get 404 or connection errors, the service may not exist."
echo "   Let's check if we need to deploy it."

echo ""
echo "📋 Option 1: Deploy via Render Dashboard"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Blueprint'"
echo "3. Connect your GitHub repository"
echo "4. Select your repository (contains render.yaml)"
echo "5. Render will auto-detect services from render.yaml"
echo "6. Click 'Apply' to deploy all services"

echo ""
echo "📋 Option 2: Manual Service Creation"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Configure the service:"
echo "   - Name: flask-test-app"
echo "   - Runtime: Python 3"
echo "   - Build Command: pip install Flask==2.2.2 flask-cors psycopg2-binary"
echo "   - Start Command: python3 enhanced_postgresql_api_routes.py"
echo "5. Add environment variables if needed"
echo "6. Click 'Create Web Service'"

echo ""
echo "📋 Option 3: Check Existing Services"
echo "1. In Render dashboard, click 'Services'"
echo "2. Look for any service with URL containing 'backend-topb'"
echo "3. Or search for 'flask' or 'python'"

echo ""
echo "✅ After deployment, test:"
echo "curl -s 'https://backend-topb.onrender.com/api/enhanced/health' | python3 -m json.tool"
