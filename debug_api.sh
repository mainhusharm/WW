#!/bin/bash
# Debug API endpoint issues - FIXED VERSION
API_URL="https://backend-topb.onrender.com/api/auth/register"

echo "🔍 Debugging API endpoint: $API_URL"
echo "====================================="

# Test 1: Check if endpoint exists (without payload)
echo "1. Testing endpoint availability..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -o /dev/null

echo ""

# Test 2: Simple test with minimal data
echo "2. Testing with minimal data..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "test123"
  }' \
  -w "\nStatus: %{http_code}\n"

echo ""

# Test 3: Check headers and full response
echo "3. Testing with verbose output..."
curl -v -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "test123"
  }' 2>&1 | head -20

echo ""
echo "✅ Debug complete!"
