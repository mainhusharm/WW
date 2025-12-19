#!/bin/bash
# Comprehensive API debugging
API_URL="https://backend-topb.onrender.com/api/auth/register"

echo "🔍 Comprehensive API Debug: $API_URL"
echo "====================================="

# Test 1: Get raw response and status
echo "1. Testing with raw response capture..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "testpassword123",
    "plan_type": "Standard"
  }' \
  -w "\nHTTPSTATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTPSTATUS:" | cut -d: -f2)
RAW_BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')

echo "Raw Response: '$RAW_BODY'"
echo "HTTP Status: $HTTP_STATUS"

if [ -z "$RAW_BODY" ] || [ "$RAW_BODY" = "null" ]; then
    echo "❌ Empty response from server"
else
    echo "✅ Got response, attempting to parse JSON..."
    echo "$RAW_BODY" | python3 -m json.tool 2>/dev/null || echo "❌ Invalid JSON response"
fi

echo ""

# Test 2: Check if endpoint exists
echo "2. Testing endpoint availability..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -w "Status: %{http_code}\n" \
  -o /dev/null

echo ""

# Test 3: Try with minimal valid data
echo "3. Testing with minimal valid data..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "testpassword123",
    "plan_type": "Standard"
  }' \
  -w "Status: %{http_code}\nResponse: " \
  2>/dev/null

echo ""
echo "✅ Debug complete!"
