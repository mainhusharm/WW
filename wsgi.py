#!/usr/bin/env python3
"""
WSGI entry point for Render deployment
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the Flask app
from journal import create_app

# Create the app instance
application = create_app()

# Debug: Print the app type and available attributes
print(f"WSGI Application created: {type(application)}")
print(f"Available attributes: {dir(application)}")

if __name__ == "__main__":
    # Get port from environment variable (Render requirement)
    port = int(os.environ.get("PORT", 8080))
    
    # Run the app
    application.run(host="0.0.0.0", port=port)
