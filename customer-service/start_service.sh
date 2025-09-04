#!/bin/bash

echo "Starting Customer Service API..."
echo "================================"

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if required packages are installed
echo "Checking dependencies..."
$PYTHON_CMD -c "import flask, flask_cors" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing required packages..."
    pip3 install flask flask-cors
fi

# Start the API server
echo "Starting server on port 3005..."
echo "Dashboard will be available at: http://localhost:3005"
echo "API endpoints:"
echo "  - Health: http://localhost:3005/health"
echo "  - Customers: http://localhost:3005/api/customers"
echo "  - Search: http://localhost:3005/api/customers/search?search=john"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

$PYTHON_CMD api.py
