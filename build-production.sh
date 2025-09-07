#!/bin/bash

# ========================================
# PRODUCTION BUILD SCRIPT
# ========================================
# This script builds the frontend for production deployment

set -e

echo "🚀 Starting production build..."

# Check Node.js version
echo "📋 Node.js version: $(node --version)"
echo "📋 NPM version: $(npm --version)"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build for production
echo "🔨 Building for production..."
npm run build:render

# Verify build output
echo "✅ Build completed successfully!"
echo "📁 Build output:"
ls -la dist/

# Check if index.html exists
if [ -f "dist/index.html" ]; then
    echo "✅ index.html found"
else
    echo "❌ index.html not found - build may have failed"
    exit 1
fi

# Check if main JS files exist
if [ -f "dist/js/main-*.js" ]; then
    echo "✅ Main JavaScript files found"
else
    echo "❌ Main JavaScript files not found - build may have failed"
    exit 1
fi

echo "🎉 Production build completed successfully!"
echo "📊 Build size:"
du -sh dist/
