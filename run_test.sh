#!/bin/bash
# Run PostgreSQL connection test script
# This script ensures we use python3 on macOS

echo "🚀 Running PostgreSQL Database Connection Test"
echo "============================================="

# Check if python3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Using python3..."
    python3 test_postgresql_connection.py
elif command -v python &> /dev/null; then
    echo "✅ Using python..."
    python test_postgresql_connection.py
else
    echo "❌ Python is not installed. Please install Python 3 first."
    echo "   You can download it from: https://python.org"
    exit 1
fi
