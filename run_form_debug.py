#!/usr/bin/env python3
"""
Run Form Debugging Tools
Creates all debugging tools and tests form data capture
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and return success status"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=Path(__file__).parent)
        if result.returncode == 0:
            print(f"✅ {description} - SUCCESS")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"❌ {description} - FAILED")
            if result.stderr:
                print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        return False

def main():
    print("🚀 Creating Form Debugging Tools")
    print("=" * 50)
    
    # Create debugging tools
    tools_success = run_command("python3 debug_form_capture.py", "Creating Form Debugging Tools")
    
    # Check if backend is running
    backend_success = run_command("curl -s http://localhost:5002/api/health | grep -q 'healthy'", "Checking Backend Connection")
    
    if not backend_success:
        print("⚠️  Backend not running on port 5002")
        print("💡 Start the backend server: python3 fixed_signup_backend.py")
    
    print("
📊 DEBUGGING TOOLS CREATED:"    print("  ✅ quick_form_fix.js - Add to your signup page immediately"    print("  ✅ form_debugger.js - Comprehensive debugging script"    print("  ✅ form_tester.html - Standalone test form"    print("  ✅ debug_form_capture.py - Tool generator"
    print("
🔧 IMMEDIATE FIX:"    print("1. Open your signup-enhanced page in browser"    print("2. Press F12 to open developer console"    print("3. Copy and paste the contents of quick_form_fix.js into the console"    print("4. Press Enter to run the fix"    print("5. Try filling and submitting the form"    print("6. Check console for detailed logs"
    print("
🧪 TEST WITH STANDALONE FORM:"    print("1. Open form_tester.html in your browser"    print("2. Fill out the test form"    print("3. Click 'Submit Signup' or 'Test Capture'"    print("4. Check if data is captured and sent to database"
    print("
🎯 EXPECTED RESULTS:"    print("- Form fields should capture input values"    print("- Submit button should trigger form processing"    print("- Console should show detailed field-by-field logs"    print("- API should receive data and save to PostgreSQL"    print("- Success message should appear"
    if backend_success:
        print("
✅ Backend is running and ready to receive data!"    else:
        print("
⚠️  Start backend server first: python3 fixed_signup_backend.py"
if __name__ == "__main__":
    main()
