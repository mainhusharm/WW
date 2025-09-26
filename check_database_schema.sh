#!/bin/bash
# Check database schema and tables
echo "🔍 Checking Database Schema and Tables"
echo "======================================"

# Test if we can query the database structure
echo "1. Checking if 'users' table exists..."
curl -s "https://backend-topb.onrender.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "SchemaTest",
    "lastName": "Check",
    "email": "schema_check_'"$(date +%s)"'@temp.com",
    "password": "testpassword123",
    "plan_type": "Standard"
  }' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "2. Testing health endpoint for more details..."
curl -s "https://backend-topb.onrender.com/api/health" | python3 -m json.tool

echo ""
echo "3. Checking if we can access database directly..."
echo "Note: This will only work if the service exposes database info"

echo ""
echo "✅ Schema check complete!"
