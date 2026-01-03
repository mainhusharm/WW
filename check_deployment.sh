#!/bin/bash
# Check what's actually running on the backend
echo "🔍 Checking What's Actually Deployed"
echo "==================================="

BASE_URL="https://backend-topb.onrender.com"

echo "1. Testing health endpoint..."
curl -s "$BASE_URL/api/health" | python3 -m json.tool
echo ""

echo "2. Testing different endpoint patterns..."
ENDPOINTS=(
  "/api/enhanced/signup"
  "/api/enhanced/health"
  "/api/auth/register"
  "/api/register"
  "/health"
  "/"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Testing: $endpoint"
    RESPONSE=$(curl -s -X POST "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d '{"test": "data"}' \
      -w "\nSTATUS:%{http_code}")

    STATUS=$(echo "$RESPONSE" | grep "STATUS:" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed -e 's/STATUS\:.*//g')

    if [ "$STATUS" = "404" ] && echo "$BODY" | grep -q "Not Found"; then
        echo "   ❌ 404 Not Found (HTML page)"
    elif [ "$STATUS" = "200" ] && echo "$BODY" | grep -q "healthy"; then
        echo "   ✅ Health endpoint working"
    elif [ "$STATUS" = "200" ] && echo "$BODY" | grep -q "success"; then
        echo "   ✅ API endpoint working"
    else
        echo "   ❓ Status: $STATUS"
    fi
done

echo ""
echo "3. Testing with GET request to see root..."
curl -s "$BASE_URL/" | head -5
echo "..."

echo ""
echo "✅ Deployment check complete!"
