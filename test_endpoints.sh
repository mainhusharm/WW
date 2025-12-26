#!/bin/bash
# Test different endpoints and check what's actually deployed
BASE_URL="https://backend-topb.onrender.com"

echo "🔍 Checking what's actually deployed on backend"
echo "==============================================="

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/api/health" \
  -w "Status: %{http_code}\n" \
  2>/dev/null

echo ""

# Test 2: Try different endpoint patterns
echo "2. Testing different endpoint patterns..."

ENDPOINTS=(
  "/api/auth/register"
  "/api/register"
  "/register"
  "/api/enhanced/signup"
  "/api/enhanced/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Testing: $endpoint"
    curl -s -X POST "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d '{"firstName": "Test", "lastName": "User", "email": "test@example.com", "password": "testpassword123", "plan_type": "Standard"}' \
      -w "Status: %{http_code}\n" \
      -o /dev/null
    echo ""
done

echo "3. Testing with verbose output on main endpoint..."
curl -v -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Test", "lastName": "User", "email": "test@example.com", "password": "testpassword123", "plan_type": "Standard"}' \
  2>&1 | head -15

echo ""
echo "✅ Endpoint testing complete!"
