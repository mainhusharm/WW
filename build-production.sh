#!/bin/bash

# Production Build Script for Render Deployment
set -e

echo "🚀 Starting production build process..."

# Check Node version
echo "📋 Node version: $(node --version)"
echo "📋 NPM version: $(npm --version)"

# Verify Node version compatibility
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Verify React packages
echo "🔍 Verifying React packages..."
if ! npm list react react-dom react-router-dom; then
    echo "❌ React packages not found or corrupted"
    exit 1
fi

# Set production environment
export NODE_ENV=production
export VITE_APP_ENV=production

# Clear any cached modules
echo "🧹 Clearing module cache..."
rm -rf .vite

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build output
echo "✅ Verifying build output..."
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist directory not found"
    exit 1
fi

echo "📁 Build contents:"
ls -la dist/

# Check for React chunks
echo "🔍 Checking React bundle..."
if ! ls dist/js/react-core-*.js >/dev/null 2>&1; then
    echo "⚠️  Warning: React core bundle not found"
    echo "📁 Available JS files:"
    ls -la dist/js/
fi

echo "🎉 Production build completed successfully!"
echo "📊 Build size:"
du -sh dist/

# Optional: Test the build locally
if [ "$1" = "--test" ]; then
    echo "🧪 Testing build locally..."
    npx serve -s dist -l 3000 &
    SERVE_PID=$!
    sleep 5
    
    # Check if server is running
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Build test successful!"
    else
        echo "❌ Build test failed!"
    fi
    
    kill $SERVE_PID
fi
