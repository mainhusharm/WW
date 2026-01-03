#!/bin/bash
# Check what database tables exist
echo "🔍 Checking Database Tables"
echo "============================"

# This will help us see what tables are actually in the database
echo "To check your database tables, run this in your PostgreSQL client:"
echo ""
echo "psql \"postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2\""
echo ""
echo "\\dt"
echo ""
echo "Or check specific table structure:"
echo "\\d enhanced_users"
echo "\\d users"
echo ""
echo "📋 What to look for:"
echo "1. If you see 'enhanced_users' table → Use enhanced_postgresql_api_routes.py"
echo "2. If you see 'users' table → Use deploy_working_api.py"
echo "3. If you see neither → Run the database schema creation script"
echo ""
echo "✅ Check your database and let me know what tables exist!"
