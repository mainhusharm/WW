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

# Check for single JavaScript bundle (no chunking approach)
JS_BUNDLE=$(find dist/assets -name "index-*.js" | head -1)
if [ -n "$JS_BUNDLE" ]; then
    echo "✅ Single JavaScript bundle found."
    echo "   Bundle: $JS_BUNDLE"
    echo "   Size: $(du -h "$JS_BUNDLE" | cut -f1)"
    
    # Check bundle size (should be large since it contains everything)
    BUNDLE_SIZE_KB=$(du -k "$JS_BUNDLE" | cut -f1)
    if [ "$BUNDLE_SIZE_KB" -gt 1000 ]; then
        echo "✅ Bundle size is optimal (> 1MB) - contains all React code"
    else
        echo "⚠️  Bundle size seems small. React code may not be properly included."
    fi
else
    echo "❌ JavaScript bundle not found. Build may have failed."
    exit 1
fi

# Check that there are no separate vendor or react-core bundles
VENDOR_BUNDLE=$(find dist/assets -name "vendor-*.js" | head -1)
REACT_BUNDLE=$(find dist/assets -name "react-core-*.js" | head -1)

if [ -n "$VENDOR_BUNDLE" ] || [ -n "$REACT_BUNDLE" ]; then
    echo "⚠️  Warning: Found separate bundles. This may cause React hooks errors."
    if [ -n "$VENDOR_BUNDLE" ]; then
        echo "   Vendor bundle: $VENDOR_BUNDLE"
    fi
    if [ -n "$REACT_BUNDLE" ]; then
        echo "   React bundle: $REACT_BUNDLE"
    fi
else
    echo "✅ No separate bundles found - single bundle approach working correctly"
fi

# Check CSS bundle
CSS_BUNDLE=$(find dist/assets -name "*.css" | head -1)
if [ -n "$CSS_BUNDLE" ]; then
    echo "✅ CSS bundle found: $CSS_BUNDLE"
else
    echo "⚠️  CSS bundle not found"
fi

echo ""
echo "🎉 Deployment build completed successfully!"
echo ""
echo "Next steps:"
echo "1. Upload the 'dist' folder to Render"
echo "2. Set the build command to: npm run build:prod"
echo "3. Set the publish directory to: dist"
echo ""
echo "The React hooks error should now be resolved with the single bundle approach!"
echo ""
echo "Key benefits of this approach:"
echo "- No chunking means no React hooks timing issues"
echo "- All React code loads together"
echo "- Simpler deployment and debugging"
