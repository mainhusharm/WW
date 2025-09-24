import requests
import json
import time

API_BASE_URL = "http://localhost:8080"
REGISTER_URL = f"{API_BASE_URL}/api/user/register"

def test_user_registration():
    """
    Sends a POST request to the registration endpoint with test user data.
    """
    test_user = {
        "firstName": "Test",
        "lastName": "User",
        "email": f"testuser_{int(time.time())}@example.com",
        "phone": "1234567890",
        "password": "password123",
        "company": "Test Inc.",
        "country": "US",
        "terms": True,
        "newsletter": False
    }

    headers = {
        "Content-Type": "application/json"
    }

    print(f"Sending test registration data to {REGISTER_URL}...")

    try:
        response = requests.post(REGISTER_URL, headers=headers, data=json.dumps(test_user))

        if response.status_code == 201:
            print("✅ Test user registration successful!")
            print(response.json())
        elif response.status_code == 409:
            print("⚠️  Test user already exists.")
            print(response.json())
        else:
            print(f"❌ Test user registration failed with status code: {response.status_code}")
            print(response.text)

    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection error: Could not connect to the server at {API_BASE_URL}.")
        print("Please ensure the backend server is running.")

if __name__ == "__main__":
    test_user_registration()
