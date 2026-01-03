#!/usr/bin/env python3
"""
Test Environment Configuration
This script tests if the environment configuration system is working correctly
"""

import os
import sys
from pathlib import Path

# Add the journal directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / 'journal'))

def test_configuration():
    """Test the configuration system"""
    print("🧪 Testing Environment Configuration System")
    print("=" * 50)
    
    try:
        # Test importing the config
        from config import config
        print("✅ Configuration module imported successfully")
        
        # Test basic configuration
        print(f"📊 Environment: {config.FLASK_ENV}")
        print(f"🔧 Debug Mode: {config.FLASK_DEBUG}")
        print(f"🌐 CORS Origins: {config.CORS_ORIGINS}")
        
        # Test payment configuration
        print("\n💳 Payment System Status:")
        payment_status = config.get_payment_status()
        print(f"   Stripe: {'✅' if payment_status['stripe'] else '❌'}")
        print(f"   PayPal: {'✅' if payment_status['paypal'] else '❌'}")
        print(f"   AI Coach: {'✅' if payment_status['ai_coach'] else '❌'}")
        print(f"   Overall: {'✅' if payment_status['overall'] else '❌'}")
        
        # Test individual keys
        print("\n🔑 API Key Status:")
        print(f"   Stripe Secret Key: {'✅' if config.STRIPE_SECRET_KEY else '❌'}")
        print(f"   PayPal Client ID: {'✅' if config.PAYPAL_CLIENT_ID else '❌'}")
        print(f"   PayPal Client Secret: {'✅' if config.PAYPAL_CLIENT_SECRET else '❌'}")
        print(f"   Gemini API Key: {'✅' if config.GEMINI_API_KEY else '❌'}")
        
        # Test environment detection
        print("\n🌍 Environment Detection:")
        print(f"   Is Production: {config.is_production()}")
        print(f"   Is Development: {config.is_development()}")
        
        # Test configuration methods
        print("\n🔍 Configuration Methods:")
        print(f"   Has Payment Keys: {config.has_payment_keys()}")
        print(f"   Has AI Coach Key: {config.has_ai_coach_key()}")
        
        print("\n🎉 Configuration test completed successfully!")
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import configuration: {e}")
        print("   Make sure you have python-dotenv installed:")
        print("   pip install python-dotenv")
        return False
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

def test_environment_files():
    """Test if environment files exist"""
    print("\n📁 Environment Files Check:")
    print("=" * 30)
    
    project_root = Path(__file__).parent
    env_files = [
        '.env',
        '.env.local', 
        '.env.production'
    ]
    
    for env_file in env_files:
        file_path = project_root / env_file
        if file_path.exists():
            print(f"   {env_file}: ✅ Exists")
            # Check file size
            size = file_path.stat().st_size
            print(f"      Size: {size} bytes")
        else:
            print(f"   {env_file}: ❌ Missing")
    
    print("\n💡 To create missing files, run:")
    print("   python setup_env.py")

def main():
    """Main test function"""
    print("🚀 Environment Configuration Test Suite")
    print("=" * 50)
    
    # Test environment files
    test_environment_files()
    
    # Test configuration system
    success = test_configuration()
    
    if success:
        print("\n🎯 Next Steps:")
        print("1. If any API keys are missing (❌), edit your .env files")
        print("2. Test payment systems with the provided examples")
        print("3. Verify AI coach functionality")
    else:
        print("\n❌ Configuration test failed!")
        print("Please check the errors above and fix them.")

if __name__ == "__main__":
    main()
