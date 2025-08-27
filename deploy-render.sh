#!/bin/bash

# Render deployment script for React app
echo "Starting Render deployment..."

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist
rm -rf node_modules/.vite

# Install dependencies
echo "Installing dependencies..."
npm ci --production=false

# Build with production configuration
echo "Building with production configuration..."
npm run build:prod

# Verify build output
echo "Verifying build output..."
if [ -d "dist" ]; then
    echo "Build successful! Dist folder created."
    ls -la dist/
    echo ""
    echo "Assets folder contents:"
    ls -la dist/assets/
else
    echo "Build failed! Dist folder not found."
    exit 1
fi

# Check for React core bundle
REACT_BUNDLE=$(find dist/assets -name "react-core-*.js" | head -1)
if [ -n "$REACT_BUNDLE" ]; then
    echo "✅ React core bundle found."
    echo "   Bundle: $REACT_BUNDLE"
    echo "   Size: $(du -h "$REACT_BUNDLE" | cut -f1)"
else
    echo "❌ Warning: React core bundle not found. This may cause hook errors."
    exit 1
fi

# Check vendor bundle size (should be small now)
VENDOR_BUNDLE=$(find dist/assets -name "vendor-*.js" | head -1)
if [ -n "$VENDOR_BUNDLE" ]; then
    VENDOR_SIZE=$(du -h "$VENDOR_BUNDLE" | cut -f1)
    echo "✅ Vendor bundle found: $VENDOR_BUNDLE (Size: $VENDOR_SIZE)"
    
    # Check if vendor bundle is reasonably small (should be < 100KB for non-React packages)
    VENDOR_SIZE_KB=$(du -k "$VENDOR_BUNDLE" | cut -f1)
    if [ "$VENDOR_SIZE_KB" -lt 100 ]; then
        echo "✅ Vendor bundle size is optimal (< 100KB)"
    else
        echo "⚠️  Vendor bundle is larger than expected. React code may still be leaking."
    fi
else
    echo "✅ No separate vendor bundle found - all packages bundled in react-core"
fi

echo ""
echo "🎉 Deployment build completed successfully!"
echo ""
echo "Next steps:"
echo "1. Upload the 'dist' folder to Render"
echo "2. Set the build command to: npm run build:prod"
echo "3. Set the publish directory to: dist"
echo ""
echo "The React hooks error should now be resolved!"
