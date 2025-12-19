#!/usr/bin/env python3
"""
Environment Setup Script
This script helps you create .env files from the examples
"""

import os
import shutil
from pathlib import Path

def setup_environment():
    """Setup environment files"""
    print("🔧 Setting up environment configuration...")
    
    # Get project root
    project_root = Path(__file__).parent
    
    # Check if .env.local exists
    env_local = project_root / '.env.local'
    if not env_local.exists():
        print("📝 Creating .env.local from env.local.example...")
        try:
            shutil.copy(project_root / 'env.local.example', env_local)
            print("✅ .env.local created successfully!")
            print("   Edit this file with your actual API keys")
        except FileNotFoundError:
            print("❌ env.local.example not found!")
            return False
    else:
        print("✅ .env.local already exists")
    
    # Check if .env.production exists
    env_production = project_root / '.env.production'
    if not env_production.exists():
        print("📝 Creating .env.production from env.production.example...")
        try:
            shutil.copy(project_root / 'env.production.example', env_production)
            print("✅ .env.production created successfully!")
            print("   Edit this file with your production API keys")
        except FileNotFoundError:
            print("❌ env.production.example not found!")
            return False
    else:
        print("✅ .env.production already exists")
    
    # Check if .env exists
    env_file = project_root / '.env'
    if not env_file.exists():
        print("📝 Creating .env from env.local.example...")
        try:
            shutil.copy(project_root / 'env.local.example', env_file)
            print("✅ .env created successfully!")
            print("   Edit this file with your development API keys")
        except FileNotFoundError:
            print("❌ env.local.example not found!")
            return False
    else:
        print("✅ .env already exists")
    
    print("\n🎯 Next steps:")
    print("1. Edit .env.local with your development API keys")
    print("2. Edit .env.production with your production API keys")
    print("3. Never commit .env files to version control")
    print("4. Use .env.local for local development")
    print("5. Use .env.production for production deployment")
    
    return True

def check_dependencies():
    """Check if required packages are installed"""
    print("🔍 Checking dependencies...")
    
    try:
        import dotenv
        print("✅ python-dotenv is installed")
    except ImportError:
        print("❌ python-dotenv is not installed")
        print("   Install it with: pip install python-dotenv")
        return False
    
    return True

def main():
    """Main setup function"""
    print("🚀 Trading Bot Environment Setup")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Please install required dependencies first")
        return
    
    # Setup environment files
    if setup_environment():
        print("\n🎉 Environment setup completed successfully!")
        print("\n📋 Important notes:")
        print("- .env.local: Development environment (safe to use)")
        print("- .env.production: Production environment (real money)")
        print("- .env: Fallback environment file")
        print("- Never commit these files to git!")
    else:
        print("\n❌ Environment setup failed!")

if __name__ == "__main__":
    main()
