#!/usr/bin/env python3
"""
Test Actual Frontend Files
Tests the actual frontend HTML files to see if they're working
"""

import requests
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import os

def test_frontend_with_selenium():
    """Test frontend files using Selenium"""
    print("🧪 Testing Frontend Files with Selenium...")
    print("=" * 50)
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        # Initialize driver
        driver = webdriver.Chrome(options=chrome_options)
        
        # Test signup-enhanced.html
        print("\n🔍 Testing signup-enhanced.html...")
        signup_path = os.path.abspath("signup-enhanced.html")
        driver.get(f"file://{signup_path}")
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "form"))
        )
        
        # Fill out the form
        driver.find_element(By.NAME, "firstName").send_keys("Selenium")
        driver.find_element(By.NAME, "lastName").send_keys("Test")
        driver.find_element(By.NAME, "email").send_keys(f"selenium_{int(time.time())}@example.com")
        driver.find_element(By.NAME, "password").send_keys("test123")
        driver.find_element(By.NAME, "phone").send_keys("1234567890")
        driver.find_element(By.NAME, "company").send_keys("Test Company")
        driver.find_element(By.NAME, "country").send_keys("US")
        
        # Submit the form
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_button.click()
        
        # Wait for response
        time.sleep(3)
        
        # Check for success message or error
        page_source = driver.page_source
        if "successfully" in page_source.lower():
            print("✅ Signup form submitted successfully")
        elif "error" in page_source.lower():
            print("❌ Signup form had an error")
        else:
            print("⚠️ Signup form response unclear")
        
        print(f"Page source snippet: {page_source[:500]}...")
        
        driver.quit()
        
    except Exception as e:
        print(f"❌ Selenium test failed: {e}")
        try:
            driver.quit()
        except:
            pass

def test_frontend_with_requests():
    """Test frontend files by making direct API calls"""
    print("\n🔍 Testing Frontend API Calls...")
    print("=" * 50)
    
    base_url = "http://localhost:8080/api"
    
    # Test 1: Registration
    print("\n1. Testing Registration...")
    registration_data = {
        "firstName": "Request",
        "lastName": "Test",
        "email": f"request_{int(time.time())}@example.com",
        "password": "test123",
        "phone": "1234567890",
        "company": "Test Company",
        "country": "US",
        "terms": True,
        "newsletter": False
    }
    
    try:
        response = requests.post(f"{base_url}/user/register", json=registration_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 201:
            print("   ✅ Registration successful")
        else:
            print("   ❌ Registration failed")
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
    
    # Test 2: Questionnaire (this will fail without JWT)
    print("\n2. Testing Questionnaire...")
    questionnaire_data = {
        "propFirm": "FTMO",
        "accountType": "Challenge",
        "accountSize": 10000,
        "riskPercentage": 1.0
    }
    
    try:
        response = requests.post(f"{base_url}/user/questionnaire", json=questionnaire_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("   ✅ Questionnaire successful")
        else:
            print("   ❌ Questionnaire failed (expected without JWT)")
    except Exception as e:
        print(f"   ❌ Questionnaire error: {e}")
    
    # Test 3: Payment
    print("\n3. Testing Payment...")
    payment_data = {
        "paymentMethod": "crypto",
        "amount": 99,
        "currency": "USDT"
    }
    
    try:
        response = requests.post(f"{base_url}/payment/verify-payment", json=payment_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("   ✅ Payment successful")
        else:
            print("   ❌ Payment failed")
    except Exception as e:
        print(f"   ❌ Payment error: {e}")
    
    # Test 4: Get customers
    print("\n4. Testing Get Customers...")
    try:
        response = requests.get(f"{base_url}/user/customers")
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Found {len(data)} customers")
        
        if response.status_code == 200:
            print("   ✅ Get customers successful")
        else:
            print("   ❌ Get customers failed")
    except Exception as e:
        print(f"   ❌ Get customers error: {e}")

def check_frontend_files():
    """Check if frontend files exist and are properly configured"""
    print("\n🔍 Checking Frontend Files...")
    print("=" * 50)
    
    frontend_files = [
        "signup-enhanced.html",
        "questionnaire.html",
        "payment.html"
    ]
    
    for file in frontend_files:
        if os.path.exists(file):
            print(f"✅ {file} exists")
            
            # Check if it's configured for localhost:8080
            with open(file, 'r') as f:
                content = f.read()
                
            if 'localhost:8080' in content:
                print(f"   ✅ {file} configured for localhost:8080")
            elif 'localhost:5000' in content:
                print(f"   ⚠️ {file} still using localhost:5000")
            elif 'render.com' in content:
                print(f"   ❌ {file} still using render.com URLs")
            else:
                print(f"   ❓ {file} API configuration unclear")
        else:
            print(f"❌ {file} not found")

def main():
    """Main test function"""
    print("🚀 Frontend Testing Suite")
    print("=" * 50)
    
    # Check frontend files
    check_frontend_files()
    
    # Test with requests
    test_frontend_with_requests()
    
    # Test with Selenium (if available)
    try:
        test_frontend_with_selenium()
    except ImportError:
        print("\n⚠️ Selenium not available - install with: pip install selenium")
    except Exception as e:
        print(f"\n⚠️ Selenium test skipped: {e}")
    
    print("\n🎯 RECOMMENDATIONS:")
    print("=" * 50)
    print("1. Open test_frontend_forms.html in your browser")
    print("2. Test each form to see what's working")
    print("3. Check browser console for JavaScript errors")
    print("4. Make sure backend is running: python3 app.py")

if __name__ == "__main__":
    main()
