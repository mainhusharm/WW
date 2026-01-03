import requests

# Replace with the actual URL of your deployed application
URL = "https://ww-2.onrender.com/login"

def test_login_with_invalid_credentials():
    """Sends a POST request with incorrect credentials and checks for a 401 status code."""
    response = requests.post(URL, json={"email": "test@example.com", "password": "wrongpassword"})
    assert response.status_code == 401, f"Expected 401, but got {response.status_code}"
    print("Test passed: Received 401 for invalid credentials.")

def test_login_with_missing_fields():
    """Sends a POST request with missing email/password and checks for a 400 status code."""
    response = requests.post(URL, json={"email": "test@example.com"})
    assert response.status_code == 400, f"Expected 400, but got {response.status_code}"
    print("Test passed: Received 400 for missing password.")

if __name__ == "__main__":
    test_login_with_invalid_credentials()
    test_login_with_missing_fields()
    print("All tests passed!")
