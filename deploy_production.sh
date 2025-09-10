#!/bin/bash

# Production deployment script
echo "🚀 Starting production deployment..."

# Install production requirements
echo "📦 Installing production requirements..."
pip install -r requirements-production.txt

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Set production environment variables
export FLASK_ENV=production
export PYTHONPATH=$PWD

# Start production server
echo "🚀 Starting production server..."
python3 start_production.py
