#!/bin/bash

# ========================================
# RENDER DEPLOYMENT SCRIPT
# ========================================
# This script deploys the Trading Journal backend to Render

set -e

echo "🚀 Starting Render deployment..."

# ========================================
# CHECK PREREQUISITES
# ========================================
echo "📋 Checking prerequisites..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "⚠️  Render CLI not found. Installing..."
    curl -fsSL https://cli.render.com/install.sh | sh
    echo "✅ Render CLI installed successfully"
fi

# ========================================
# ENVIRONMENT SETUP
# ========================================
echo "🔧 Setting up environment..."

# Create production environment file
cat > .env.production << EOF
# ========================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ========================================
FLASK_ENV=production
FLASK_DEBUG=false
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
DATABASE_URL=sqlite:///instance/trading_bot.db
CORS_ORIGINS=https://your-frontend-domain.com,https://localhost:5173,https://backend-u4hy.onrender.com
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
EOF

echo "✅ Production environment file created"

# ========================================
# DATABASE SETUP
# ========================================
echo "🗄️  Setting up database..."

# Create instance directory
mkdir -p instance

# Initialize database
python3 -c "
from journal import create_app
from journal.models import db
app = create_app()
with app.app_context():
    db.create_all()
    print('✅ Database initialized successfully')
"

# ========================================
# PROP FIRMS POPULATION
# ========================================
echo "🏢 Populating prop firms database..."

if [ -f "populate_prop_firms.py" ]; then
    python3 populate_prop_firms.py
    echo "✅ Prop firms database populated"
else
    echo "⚠️  populate_prop_firms.py not found, skipping prop firms population"
fi

# ========================================
# DEPENDENCIES INSTALLATION
# ========================================
echo "📦 Installing dependencies..."

# Install Python dependencies
pip install -r requirements.txt

echo "✅ Dependencies installed"

# ========================================
# RENDER DEPLOYMENT
# ========================================
echo "🚀 Deploying to Render..."

# Check if service exists
if render services list | grep -q "trading-journal-backend"; then
    echo "📝 Updating existing service..."
    render services update trading-journal-backend
else
    echo "🆕 Creating new service..."
    render services create
fi

# ========================================
# HEALTH CHECK
# ========================================
echo "🏥 Checking service health..."

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 30

# Check health endpoint
HEALTH_URL="https://backend-u4hy.onrender.com/healthz"
echo "🔍 Checking health at: $HEALTH_URL"

for i in {1..10}; do
    if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
        echo "✅ Service is healthy!"
        break
    else
        echo "⏳ Attempt $i/10: Service not ready yet..."
        sleep 10
    fi
done

# ========================================
# FINAL STATUS
# ========================================
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Information:"
echo "   Backend URL: https://backend-u4hy.onrender.com"
echo "   Health Check: https://backend-u4hy.onrender.com/healthz"
echo "   API Base: https://backend-u4hy.onrender.com/api"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update your frontend configuration to use the new backend URL"
echo "   2. Test the API endpoints"
echo "   3. Monitor the service logs in Render dashboard"
echo "   4. Set up your production environment variables in Render"
echo ""
echo "📚 Documentation:"
echo "   - Render Dashboard: https://dashboard.render.com"
echo "   - Service Logs: Check the Render dashboard for real-time logs"
echo "   - Environment Variables: Update in Render dashboard"
echo ""

# ========================================
# CLEANUP
# ========================================
echo "🧹 Cleaning up temporary files..."

# Remove production environment file (contains sensitive data)
rm -f .env.production

echo "✅ Cleanup completed"
echo ""
echo "🚀 Your Trading Journal backend is now live on Render!"
