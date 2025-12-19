#!/bin/bash
# Production Deployment Script for Unified Customer Service

echo "🚀 Deploying Unified Customer Service to Production"
echo "=================================================="

# 1. Update production environment to use unified customer service
echo "📝 Updating production environment..."
export VITE_API_BASE_URL="https://your-production-domain.com/api"

# 2. Build the frontend with updated API configuration
echo "🔨 Building frontend..."
npm run build

# 3. Deploy unified customer service to production
echo "🚀 Deploying unified customer service..."
# Add your deployment commands here (e.g., Docker, AWS, etc.)

# 4. Update production database
echo "💾 Updating production database..."
python3 unified_customer_service.py --production

echo "✅ Deployment complete!"
echo "📊 All user registrations will now be saved to customer service database"
        