#!/usr/bin/env python3
"""
Deployment Verification Script
Run this to verify all components are working correctly
"""

import sys
import os

def test_imports():
    """Test all critical imports"""
    print("🔍 Testing imports...")
    
    try:
        from app import application
        print("✅ app.py imports successfully")
    except Exception as e:
        print(f"❌ app.py import failed: {e}")
        return False
    
    try:
        from cors_proxy import app as cors_app
        print("✅ cors_proxy.py imports successfully")
    except Exception as e:
        print(f"❌ cors_proxy.py import failed: {e}")
        return False
    
    try:
        from journal import create_app, socketio
        print("✅ journal module imports successfully")
    except Exception as e:
        print(f"❌ journal module import failed: {e}")
        return False
    
    return True

def test_file_structure():
    """Test file structure"""
    print("\n📁 Testing file structure...")
    
    required_files = [
        'app.py',
        'cors_proxy.py',
        'requirements.txt',
        'requirements-cors-proxy.txt',
        'render.yaml',
        'journal/__init__.py',
        'journal/run.py'
    ]
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path} exists")
        else:
            print(f"❌ {file_path} missing")
            return False
    
    return True

def test_configuration():
    """Test configuration files"""
    print("\n⚙️ Testing configuration...")
    
    try:
        with open('render.yaml', 'r') as f:
            content = f.read()
            if 'gunicorn --worker-class eventlet -w 1 app:application' in content:
                print("✅ render.yaml has correct backend start command")
            else:
                print("❌ render.yaml has incorrect backend start command")
                return False
            
            if 'python cors_proxy.py' in content:
                print("✅ render.yaml has correct CORS proxy start command")
            else:
                print("❌ render.yaml has incorrect CORS proxy start command")
                return False
    except Exception as e:
        print(f"❌ Error reading render.yaml: {e}")
        return False
    
    return True

def main():
    """Main verification function"""
    print("🚀 Deployment Verification Script")
    print("=" * 40)
    
    all_tests_passed = True
    
    all_tests_passed &= test_file_structure()
    all_tests_passed &= test_configuration()
    all_tests_passed &= test_imports()
    
    print("\n" + "=" * 40)
    if all_tests_passed:
        print("🎉 All tests passed! Deployment should work.")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
    
    return all_tests_passed

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
