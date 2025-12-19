#!/usr/bin/env python3
"""
Clear all signals from the backend to start fresh with only admin-generated signals
"""

import requests
import json

def clear_all_signals():
    """Clear all signals from the backend"""
    backend_url = "https://backend-bkt7.onrender.com"
    
    try:
        # Get current signals
        response = requests.get(f"{backend_url}/api/signals")
        if response.status_code == 200:
            data = response.json()
            signals = data.get('signals', [])
            print(f"Found {len(signals)} signals in backend")
            
            # Show current signals
            for signal in signals:
                print(f"  - {signal['pair']} {signal['direction']} ({signal['source']}) - {signal['created_at']}")
            
            # Note: The backend doesn't have a clear endpoint, so we'll just note what's there
            print("\nNote: Backend doesn't have a clear endpoint.")
            print("The enhanced signal service will only show admin_generated signals.")
            print("Bot-generated signals will be ignored by the frontend.")
            
        else:
            print(f"Failed to get signals: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    clear_all_signals()
