#!/bin/bash

# ========================================
# FRONTEND RENDER DEPLOYMENT SCRIPT
# ========================================
# This script deploys the Trading Journal frontend to Render

set -e

echo "🚀 Starting frontend deployment to Render..."

# ========================================
# CHECK PREREQUISITES
# ========================================
echo "📋 Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# ========================================
# CLEAN PREVIOUS BUILD
# ========================================
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf node_modules/

# ========================================
# INSTALL DEPENDENCIES
# ========================================
echo "📦 Installing dependencies..."
npm ci --production=false

# ========================================
# BUILD FOR PRODUCTION
# ========================================
echo "🔨 Building for production..."
npm run build:render

# ========================================
# VERIFY BUILD OUTPUT
# ========================================
echo "✅ Verifying build output..."

if [ ! -d "dist" ]; then
    echo "❌ Build failed! No dist/ directory found."
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed! index.html not found."
    exit 1
fi

echo "✅ Build successful! Contents of dist/:"
ls -la dist/

echo "📊 Build size:"
du -sh dist/

# ========================================
# CREATE RENDER DEPLOYMENT
# ========================================
echo "🚀 Creating Render deployment..."

# Check if render CLI is installed
if command -v render &> /dev/null; then
    echo "📝 Using Render CLI..."
    
    # Check if service exists
    if render services list | grep -q "trading-journal-frontend"; then
        echo "📝 Updating existing frontend service..."
        render services update trading-journal-frontend
    else
        echo "🆕 Creating new frontend service..."
        render services create
    fi
else
    echo "⚠️  Render CLI not found. Please install it or deploy manually."
    echo "📚 Manual deployment instructions:"
    echo "   1. Go to https://dashboard.render.com"
    echo "   2. Create a new Web Service"
    echo "   3. Connect your GitHub repository"
    echo "   4. Set build command: npm ci --production=false && npm run build:render"
    echo "   5. Set start command: serve -s dist -l \$PORT --single"
    echo "   6. Set environment variables:"
    echo "      - VITE_API_BASE_URL=https://backend-u4hy.onrender.com"
    echo "      - VITE_YFINANCE_PROXY_URL=https://backend-u4hy.onrender.com"
    echo "      - VITE_BINANCE_SERVICE_URL=https://backend-u4hy.onrender.com"
    echo "      - VITE_FOREX_DATA_SERVICE_URL=https://backend-u4hy.onrender.com"
fi

# ========================================
# FINAL STATUS
# ========================================
echo ""
echo "🎉 Frontend deployment completed successfully!"
echo ""
echo "📊 Build Information:"
echo "   Build directory: dist/"
echo "   Main bundle: dist/js/index-*.js"
echo "   CSS bundle: dist/css/index-*.css"
echo "   HTML file: dist/index.html"
echo ""
echo "🔧 Next Steps:"
echo "   1. Deploy to Render using the dashboard or CLI"
echo "   2. Set environment variables in Render"
echo "   3. Test the deployed frontend"
echo "   4. Verify backend integration"
echo ""
echo "📚 Render Configuration:"
echo "   Build Command: npm ci --production=false && npm run build:render"
echo "   Start Command: serve -s dist -l \$PORT --single"
echo "   Environment: Node.js"
echo "   Plan: Free tier available"
echo ""

echo "🚀 Your Trading Journal frontend is ready for Render deployment!"
