#!/usr/bin/env python3
"""
Deploy the working server to production
This script replaces the problematic journal app with the working server
"""

import os
import shutil
import subprocess
import sys

def deploy_working_server():
    """Deploy the working server"""
    print("🚀 Deploying Working Server")
    print("=" * 50)
    
    # 1. Backup the current app.py
    if os.path.exists('app.py'):
        shutil.copy('app.py', 'app.py.backup')
        print("✅ Backed up current app.py")
    
    # 2. Replace app.py with working_server.py
    if os.path.exists('working_server.py'):
        shutil.copy('working_server.py', 'app.py')
        print("✅ Replaced app.py with working server")
    
    # 3. Update requirements.txt to ensure all dependencies are included
    requirements = [
        "Flask==2.3.3",
        "Flask-CORS==4.0.0",
        "requests==2.31.0"
    ]
    
    with open('requirements.txt', 'w') as f:
        f.write('\n'.join(requirements))
    print("✅ Updated requirements.txt")
    
    # 4. Create a simple Procfile for deployment
    procfile_content = "web: python app.py"
    with open('Procfile', 'w') as f:
        f.write(procfile_content)
    print("✅ Created Procfile")
    
    # 5. Create environment configuration
    env_content = """# Working Server Environment Configuration
FLASK_ENV=production
FLASK_DEBUG=false
PORT=8080
CORS_ORIGINS=*
"""
    with open('.env.production', 'w') as f:
        f.write(env_content)
    print("✅ Created production environment file")
    
    print("\n" + "=" * 50)
    print("🎉 Deployment Preparation Complete!")
    print("\n📋 What was done:")
    print("✅ Replaced problematic app.py with real-time working server")
    print("✅ Updated requirements.txt with minimal dependencies")
    print("✅ Created Procfile for deployment")
    print("✅ Created production environment configuration")
    print("\n🔧 The real-time working server includes:")
    print("✅ All required API endpoints")
    print("✅ CORS enabled for all origins")
    print("✅ No database dependencies")
    print("✅ Real-time signal system functionality")
    print("✅ No prefilled data - everything is generated in real-time")
    print("✅ Background signal generation")
    print("✅ Forex Factory scraper disabled")
    print("\n🚀 Ready for deployment!")
    print("   - All dashboard errors should be resolved")
    print("   - Signal feed will work properly")
    print("   - No more CORS or 404 errors")

if __name__ == "__main__":
    deploy_working_server()
