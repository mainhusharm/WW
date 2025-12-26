def test_signup_endpoint():
    """Test signup endpoint"""
    print("\n🔍 Testing signup endpoint...")

    try:
        response = requests.post(
            'https://backend-topb.on.render.com/api/auth/register',
            json=TEST_USER_DATA,
            headers={'Content-Type': 'application/json'},
            timeout=15
        )

        if response.status_code == 201:
            data = response.json()
            if data.get('success') and data.get('user_id'):
                print("✅ Signup endpoint working correctly!")
                print(f"   User ID: {data['user_id']}")
                print(f"   Message: {data['message']}")
                return True
            else:
                print(f"❌ Signup endpoint returned unexpected response: {data}")
                return False
        elif response.status_code == 200:
            print("✅ Signup endpoint working - user already exists (expected for test)")
            return True
        else:
            print(f"❌ Signup endpoint failed with status {response.status_code}: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Signup endpoint failed: {e}")
        return False
