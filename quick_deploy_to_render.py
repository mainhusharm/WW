#!/usr/bin/env python3
"""
Quick Deploy Enhanced Signal System to Render
This script helps you deploy the enhanced signal system to your existing Render backend
"""

import subprocess
import sys
import os
import time

def run_command(command, description):
    """Run a command and return the result"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            return True, result.stdout
        else:
            print(f"❌ {description} failed: {result.stderr}")
            return False, result.stderr
    except Exception as e:
        print(f"❌ Error during {description}: {e}")
        return False, str(e)

def main():
    print("🚀 Quick Deploy Enhanced Signal System to Render")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("app.py"):
        print("❌ Error: app.py not found. Please run this script from the project root.")
        sys.exit(1)
    
    # Check if git is initialized
    if not os.path.exists(".git"):
        print("📦 Initializing Git repository...")
        success, output = run_command("git init", "Git initialization")
        if not success:
            print("❌ Failed to initialize Git repository")
            sys.exit(1)
        
        # Add all files
        success, output = run_command("git add .", "Adding files to Git")
        if not success:
            print("❌ Failed to add files to Git")
            sys.exit(1)
        
        # Initial commit
        success, output = run_command('git commit -m "Initial commit with enhanced signal system"', "Initial commit")
        if not success:
            print("❌ Failed to create initial commit")
            sys.exit(1)
    
    # Check current status
    print("\n📊 Current Git Status:")
    run_command("git status --short", "Checking Git status")
    
    # Add all changes
    print("\n📝 Adding all changes...")
    success, output = run_command("git add .", "Adding changes to Git")
    if not success:
        print("❌ Failed to add changes")
        sys.exit(1)
    
    # Check if there are changes to commit
    success, output = run_command("git diff --cached --quiet", "Checking for changes")
    if success:
        print("ℹ️ No changes to commit")
    else:
        # Commit changes
        print("\n💾 Committing enhanced signal system...")
        commit_message = """Add Enhanced Signal System

- Real-time signal delivery from admin to users
- Signal persistence (signals never deleted)
- Risk-reward filtering based on user preferences
- Enhanced UI with modern design
- WebSocket integration for real-time updates
- Database-backed signal storage
- Comprehensive signal statistics"""
        
        success, output = run_command(f'git commit -m "{commit_message}"', "Committing changes")
        if not success:
            print("❌ Failed to commit changes")
            sys.exit(1)
    
    # Check if remote origin exists
    success, output = run_command("git remote get-url origin", "Checking remote origin")
    if not success:
        print("\n🔗 Setting up Render remote origin...")
        print("Please provide your Render Git repository URL:")
        print("Example: https://git.render.com/your-username/your-repo-name.git")
        render_git_url = input("Render Git URL: ").strip()
        
        if not render_git_url:
            print("❌ Error: Render Git URL is required")
            sys.exit(1)
        
        success, output = run_command(f"git remote add origin {render_git_url}", "Adding remote origin")
        if not success:
            print("❌ Failed to add remote origin")
            sys.exit(1)
    
    # Push to Render
    print("\n🚀 Pushing to Render...")
    success, output = run_command("git push origin main", "Pushing to Render")
    if not success:
        # Try master branch if main fails
        print("⚠️ Main branch failed, trying master branch...")
        success, output = run_command("git push origin master", "Pushing to Render (master)")
        if not success:
            print("❌ Failed to push to Render")
            print("Please check your Git repository URL and try again")
            sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ Enhanced Signal System Deployed to Render!")
    print("=" * 50)
    print("")
    print("🌐 Your backend URL: https://backend-u4hy.onrender.com")
    print("📡 WebSocket URL: wss://backend-u4hy.onrender.com")
    print("")
    print("⏳ Please wait 2-3 minutes for Render to build and deploy...")
    print("")
    print("🔧 Test Commands (run after deployment):")
    print("curl https://backend-u4hy.onrender.com/healthz")
    print("curl https://backend-u4hy.onrender.com/api/signals/admin")
    print("curl https://backend-u4hy.onrender.com/api/signals/stats")
    print("")
    print("🎉 Enhanced Signal System is now being deployed to Render!")
    print("")
    print("📱 Next Steps:")
    print("1. Wait for deployment to complete (2-3 minutes)")
    print("2. Test the backend endpoints")
    print("3. Create signals from admin dashboard")
    print("4. Check user dashboard for real-time signals")

if __name__ == "__main__":
    main()
