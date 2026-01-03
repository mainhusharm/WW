#!/usr/bin/env python3
"""
Test script for email normalization functionality
This script tests the email normalization logic to ensure it works correctly
"""

def test_email_normalization():
    """Test the email normalization function"""
    
    # Test cases for email normalization
    test_cases = [
        # Basic cases
        ("test@example.com", "test@example.com"),
        ("TEST@EXAMPLE.COM", "test@example.com"),
        (" test@example.com ", "test@example.com"),
        
        # Gmail dot removal
        ("test@gmail.com", "test@gmail.com"),
        ("t.e.s.t@gmail.com", "test@gmail.com"),
        ("t.e.s.t.@gmail.com", "test@gmail.com"),
        ("test..test@gmail.com", "testtest@gmail.com"),
        
        # Gmail plus alias removal
        ("test+alias@gmail.com", "test@gmail.com"),
        ("test+123@gmail.com", "test@gmail.com"),
        ("test+alias+more@gmail.com", "test@gmail.com"),
        
        # Combined cases
        ("T.E.S.T+alias@gmail.com", "test@gmail.com"),
        (" Test.Test+alias@Gmail.Com ", "testtest@gmail.com"),
        
        # Non-Gmail cases (should not be modified except for case and whitespace)
        ("test@yahoo.com", "test@yahoo.com"),
        ("t.e.s.t@yahoo.com", "t.e.s.t@yahoo.com"),
        ("test+alias@yahoo.com", "test+alias@yahoo.com"),
        
        # Edge cases
        ("", ""),
        ("@gmail.com", "@gmail.com"),
        ("test@", "test@"),
        ("test", "test"),
    ]
    
    print("🧪 Testing Email Normalization")
    print("=" * 50)
    
    # Import the normalize_email function from the User model
    try:
        import sys
        import os
        
        # Add the journal directory to the path
        sys.path.append(os.path.join(os.path.dirname(__file__), 'journal'))
        
        from journal.models import User
        
        passed = 0
        failed = 0
        
        for input_email, expected_output in test_cases:
            try:
                result = User.normalize_email(input_email)
                
                if result == expected_output:
                    print(f"✅ PASS: '{input_email}' -> '{result}'")
                    passed += 1
                else:
                    print(f"❌ FAIL: '{input_email}' -> '{result}' (expected: '{expected_output}')")
                    failed += 1
                    
            except Exception as e:
                print(f"❌ ERROR: '{input_email}' -> Exception: {str(e)}")
                failed += 1
        
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All tests passed! Email normalization is working correctly.")
        else:
            print("⚠️  Some tests failed. Please check the implementation.")
            
        return failed == 0
        
    except ImportError as e:
        print(f"❌ Import error: {str(e)}")
        print("Make sure you're running this from the project root directory.")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_duplicate_detection():
    """Test that duplicate emails are properly detected"""
    
    print("\n🧪 Testing Duplicate Email Detection")
    print("=" * 50)
    
    # Test cases that should be considered duplicates
    duplicate_test_cases = [
        ("test@gmail.com", "test@gmail.com"),
        ("test@gmail.com", "t.e.s.t@gmail.com"),
        ("test@gmail.com", "test+alias@gmail.com"),
        ("test@gmail.com", "T.E.S.T+alias@gmail.com"),
        ("test@example.com", "test@example.com"),
        ("test@example.com", "TEST@EXAMPLE.COM"),
    ]
    
    try:
        import sys
        import os
        
        # Add the journal directory to the path
        sys.path.append(os.path.join(os.path.dirname(__file__), 'journal'))
        
        from journal.models import User
        
        passed = 0
        failed = 0
        
        for email1, email2 in duplicate_test_cases:
            try:
                normalized1 = User.normalize_email(email1)
                normalized2 = User.normalize_email(email2)
                
                if normalized1 == normalized2:
                    print(f"✅ PASS: '{email1}' and '{email2}' are correctly identified as duplicates")
                    print(f"   Normalized: '{normalized1}'")
                    passed += 1
                else:
                    print(f"❌ FAIL: '{email1}' and '{email2}' should be duplicates but aren't")
                    print(f"   Normalized: '{normalized1}' vs '{normalized2}'")
                    failed += 1
                    
            except Exception as e:
                print(f"❌ ERROR: Testing '{email1}' vs '{email2}' -> Exception: {str(e)}")
                failed += 1
        
        print("\n" + "=" * 50)
        print(f"📊 Duplicate Detection Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All duplicate detection tests passed!")
        else:
            print("⚠️  Some duplicate detection tests failed.")
            
        return failed == 0
        
    except ImportError as e:
        print(f"❌ Import error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def main():
    """Main test function"""
    
    print("🚀 Email Normalization Test Suite")
    print("=" * 60)
    
    # Test basic normalization
    normalization_success = test_email_normalization()
    
    # Test duplicate detection
    duplicate_detection_success = test_duplicate_detection()
    
    print("\n" + "=" * 60)
    print("📋 Overall Test Summary")
    print("=" * 60)
    
    if normalization_success and duplicate_detection_success:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Email normalization is working correctly")
        print("✅ Duplicate email detection is working correctly")
        print("\n📝 The one email - one account restriction is properly implemented!")
    else:
        print("❌ SOME TESTS FAILED!")
        print("⚠️  Please check the implementation and fix any issues")
    
    return normalization_success and duplicate_detection_success

if __name__ == '__main__':
    main()
