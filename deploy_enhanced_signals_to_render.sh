#!/bin/bash

# Enhanced Signal System Deployment to Render
# This script deploys the enhanced signal system to your existing Render backend

echo "🚀 Deploying Enhanced Signal System to Render"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: app.py not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit with enhanced signal system"
fi

# Check current git status
echo "📊 Current Git Status:"
git status --short

# Add all changes
echo "📝 Adding all changes to Git..."
git add .

# Commit changes
echo "💾 Committing enhanced signal system..."
git commit -m "Add Enhanced Signal System

- Real-time signal delivery from admin to users
- Signal persistence (signals never deleted)
- Risk-reward filtering based on user preferences
- Enhanced UI with modern design
- WebSocket integration for real-time updates
- Database-backed signal storage
- Comprehensive signal statistics"

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adding Render remote origin..."
    echo "Please provide your Render Git repository URL:"
    echo "Example: https://git.render.com/your-username/your-repo-name.git"
    read -p "Render Git URL: " RENDER_GIT_URL
    
    if [ -z "$RENDER_GIT_URL" ]; then
        echo "❌ Error: Render Git URL is required"
        exit 1
    fi
    
    git remote add origin "$RENDER_GIT_URL"
fi

# Push to Render
echo "🚀 Pushing to Render..."
git push origin main

echo ""
echo "✅ Enhanced Signal System Deployed to Render!"
echo "=============================================="
echo ""
echo "🌐 Your backend URL: https://backend-u4hy.onrender.com"
echo "📡 WebSocket URL: wss://backend-u4hy.onrender.com"
echo ""
echo "🔧 Next Steps:"
echo "1. Wait 2-3 minutes for Render to build and deploy"
echo "2. Test the deployment: curl https://backend-u4hy.onrender.com/healthz"
echo "3. Create test signals using the admin dashboard"
echo "4. Check your user dashboard for real-time signals"
echo ""
echo "📊 Test Commands:"
echo "curl https://backend-u4hy.onrender.com/api/signals/admin"
echo "curl https://backend-u4hy.onrender.com/api/signals/stats"
echo ""
echo "🎉 Enhanced Signal System is now live on Render!"
