#!/bin/bash
# Simple API test without database dependencies
# This tests just the API endpoints

echo "🚀 Testing API Endpoints Only"
echo "=============================="

API_BASE="https://backend-topb.onrender.com/api/enhanced"

# Test 1: Health check
echo "🔍 Testing health endpoint..."
curl -s "$API_BASE/health" | python3 -m json.tool
echo ""

# Test 2: Test signup with sample data
echo "🔍 Testing signup endpoint..."
curl -s -X POST "$API_BASE/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test_'$(date +%s)'@example.com",
    "phone": "+1234567890",
    "password": "testpassword123",
    "company": "Test Company",
    "country": "US",
    "agree_to_terms": true,
    "agree_to_marketing": false
  }' | python3 -m json.tool

echo ""
echo "✅ API tests completed!"
