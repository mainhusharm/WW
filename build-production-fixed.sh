#!/bin/bash

# Production build script with 3D component fixes
echo "🚀 Starting production build with 3D fixes..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.vite/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Update Three.js to latest compatible version
echo "🔧 Updating Three.js dependencies..."
npm install three@^0.170.0 @react-three/fiber@^8.18.0 @react-three/drei@^9.122.0

# Build the application
echo "🏗️ Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output: dist/"
    echo "🌐 Ready for deployment to Render"
    
    # Show build size
    echo "📊 Build size:"
    du -sh dist/
    
    # List main files
    echo "📋 Main build files:"
    ls -la dist/
    
else
    echo "❌ Build failed!"
    exit 1
fi