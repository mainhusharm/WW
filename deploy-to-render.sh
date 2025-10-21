#!/bin/bash

# Deploy Trading Platform to Render
echo "🚀 Deploying Trading Platform to Render..."

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Installing..."
    curl -fsSL https://cli.render.com/install | sh
    export PATH="$PATH:$HOME/.render"
fi

# Login to Render (you'll need to do this manually)
echo "🔐 Please login to Render:"
render auth login

# Deploy services
echo "📦 Deploying services..."

# Deploy database
echo "🗄️  Deploying PostgreSQL database..."
render services create --name trading-platform-db --type pserv --plan starter --dockerfile-path ./Dockerfile.db

# Deploy backend API
echo "🔧 Deploying backend API..."
render services create --name trading-platform-api --type web --plan starter --build-command "pip install -r requirements-render.txt" --start-command "python render_backend_api.py"

# Deploy frontend
echo "🎨 Deploying frontend..."
render services create --name trading-platform-frontend --type web --plan starter --build-command "npm install && npm run build" --static-publish-path ./dist

echo "✅ Deployment initiated!"
echo "📋 Next steps:"
echo "1. Set environment variables in Render dashboard"
echo "2. Connect database to backend API"
echo "3. Update frontend API URL"
echo "4. Test the deployment"

echo "🌐 Your services will be available at:"
echo "   Database: trading-platform-db.onrender.com"
echo "   API: trading-platform-api.onrender.com"
echo "   Frontend: trading-platform-frontend.onrender.com"