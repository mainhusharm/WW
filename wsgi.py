#!/usr/bin/env python3
"""
WSGI entry point for Render deployment
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the Flask app
from journal import create_app

# Create the app instance
app = create_app()

if __name__ == "__main__":
    # Get port from environment variable (Render requirement)
    port = int(os.environ.get("PORT", 8080))
    
    # Run the app
    app.run(host="0.0.0.0", port=port)
