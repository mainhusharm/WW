#!/usr/bin/env python3
"""
Test yfinance to see if it's working properly
"""

import yfinance as yf
from datetime import datetime

def test_futures_data():
    tickers = {
        "SP500": "ES=F",
        "NASDAQ": "NQ=F", 
        "DOW": "YM=F",
        "RUSSELL": "RTY=F",
        "CRUDE": "CL=F",
        "GOLD": "GC=F",
        "SILVER": "SI=F"
    }
    
    print("Testing yfinance futures data...")
    
    for name, ticker in tickers.items():
        try:
            print(f"\nFetching {name} ({ticker})...")
            stock = yf.Ticker(ticker)
            
            # Try different methods to get price
            print("  - Trying historical data...")
            hist = stock.history(period="1d", interval="1m")
            if not hist.empty:
                price = hist['Close'].iloc[-1]
                print(f"  ✅ Historical: ${price:.2f}")
            else:
                print("  ❌ No historical data")
                
            print("  - Trying info...")
            info = stock.info
            price = info.get('regularMarketPrice', info.get('previousClose', info.get('currentPrice')))
            if price:
                print(f"  ✅ Info: ${price:.2f}")
            else:
                print("  ❌ No info data")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")

if __name__ == "__main__":
    test_futures_data()
