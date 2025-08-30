#!/bin/bash

echo "🚀 Building TraderEdge Pro for production with React 18 compatibility fixes..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.vite

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Set environment variables for production build
export NODE_ENV=production
export VITE_APP_ENV=production

# Build with production optimizations
echo "🔨 Building application..."
npm run build:production

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Create a simple health check file
    echo "Creating health check file..."
    echo "OK" > dist/health.txt
    
    # Create a simple error page for 3D failures
    echo "Creating fallback error page..."
    cat > dist/3d-error.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TraderEdge Pro - Loading</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            text-align: center;
            max-width: 500px;
            padding: 2rem;
        }
        .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .title {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #06b6d4, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .message {
            font-size: 1.1rem;
            color: #94a3b8;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .button {
            background: linear-gradient(45deg, #06b6d4, #3b82f6);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 0.75rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #1e293b;
            border-top: 4px solid #06b6d4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎯</div>
        <h1 class="title">TraderEdge Pro</h1>
        <div class="spinner"></div>
        <p class="message">
            Loading your trading experience...<br>
            If this takes too long, please refresh the page.
        </p>
        <button class="button" onclick="window.location.reload()">
            Refresh Page
        </button>
    </div>
    <script>
        // Auto-refresh after 10 seconds if still loading
        setTimeout(() => {
            if (document.visibilityState !== 'hidden') {
                window.location.reload();
            }
        }, 10000);
    </script>
</body>
</html>
EOF
    
    echo "📁 Build files created in dist/ directory"
    echo "🌐 Ready for deployment!"
    
    # Show build size
    echo "📊 Build size:"
    du -sh dist/
    
else
    echo "❌ Build failed!"
    exit 1
fi
