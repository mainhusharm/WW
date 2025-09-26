    def test_user_registration(self):
        """Test user registration with all form fields"""
        test_user = {
            "firstName": "Test",
            "lastName": "User",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "password": "testpassword123",
            "phone": "+1234567890",
            "company": "Test Company Inc",
            "country": "US",
            "terms": True,
            "newsletter": False,
            "plan_type": "Standard",
            "plan_price": 99.00
        }
        
        try:
            response = requests.post(
                f"{self.api_base_url}/api/user/register",
                json=test_user,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                
                # Handle both response formats
                is_success = (data.get('success') == True or 
                            data.get('msg') == 'User registered successfully' or
                            data.get('message') == 'User registered successfully')
                
                user_id = data.get('user_id') or data.get('id')
                
                if is_success and user_id:
                    # Normalize the response for downstream tests
                    normalized_data = {
                        'success': True,
                        'user_id': user_id,
                        'user': {
                            'id': user_id,
                            'email': test_user['email'],
                            'firstName': test_user['firstName'],
                            'lastName': test_user['lastName']
                        }
                    }
                    
                    self.log_test("User Registration", True, 
                                f"User created successfully with ID: {user_id}")
                    return normalized_data
                else:
                    self.log_test("User Registration", False, 
                                f"Registration failed: {data}", data)
                    return None
            else:
                self.log_test("User Registration", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("User Registration", False, f"Registration error: {e}")
            return None
