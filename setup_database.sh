#!/bin/bash

echo "🚀 TRADEREDGEPRO DATABASE SETUP SCRIPT"
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

echo "✅ Python 3 found"

# Install required dependencies
echo "📦 Installing required dependencies..."
pip3 install psycopg2-binary

if [ $? -ne 0 ]; then
    echo "❌ Failed to install psycopg2-binary"
    echo "💡 Try: brew install postgresql (on macOS) or apt-get install postgresql-dev (on Ubuntu)"
    exit 1
fi

echo "✅ Dependencies installed"

# Make the Python script executable
chmod +x apply_database_schema.py

# Run the schema setup
echo "🚀 Running database schema setup..."
python3 apply_database_schema.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Your database is ready!"
    echo ""
    echo "📋 What's been created:"
    echo "  ✅ enhanced_users table (signup data)"
    echo "  ✅ payment_transactions table (payment data)"
    echo "  ✅ questionnaire_responses table (questionnaire data)"
    echo "  ✅ user_dashboard_data table (dashboard metrics)"
    echo "  ✅ signal_tracking table (signal performance)"
    echo "  ✅ Views for easy data access"
    echo "  ✅ Indexes for performance"
    echo "  ✅ Triggers for automatic updates"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Deploy your API: python3 enhanced_postgresql_api_routes.py"
    echo "  2. Test the system: python3 test_enhanced_database_system.py"
    echo "  3. Update your frontend components with new API endpoints"
    echo ""
else
    echo "❌ Database setup failed. Check the error messages above."
    exit 1
fi
