#!/bin/bash
echo "🚀 Starting TraderEdgePro Backend Server..."

# Install required packages
python3 -m pip install flask flask-cors psycopg2-binary

# Start backend server
python3 working_backend_server.py
