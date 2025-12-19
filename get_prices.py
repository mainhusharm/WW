import yfinance as yf
import time
import os

def get_stock_price(ticker_symbol):
    """Fetches the last price for a given ticker symbol using 1-minute interval data."""
    try:
        ticker = yf.Ticker(ticker_symbol)
        # Fetch 1 day of 1-minute data to get the most recent price
        hist = ticker.history(period="1d", interval="1m")
        if not hist.empty:
            return hist['Close'].iloc[-1]
        else:
            # Fallback to the info dictionary if history is empty
            return ticker.info.get('regularMarketPrice', ticker.info.get('previousClose'))
    except Exception as e:
        return f"Error fetching price: {e}"

def display_prices():
    """Continuously fetches and displays prices for NASDAQ-100 and S&P 500 futures."""
    tickers = {
        "NASDAQ-100 Futures": "NQ=F",
        "S&P 500 Futures": "ES=F",
        "Dow Jones Futures": "YM=F",
        "Russell 2000 Futures": "RTY=F",
        "Crude Oil Futures": "CL=F",
        "Gold Futures": "GC=F",
        "Silver Futures": "SI=F"
    }
    
    print("--- Real-Time Stock Prices ---")
    print("Fetching data... (Press Ctrl+C to stop)\n")
    
    try:
        while True:
            os.system('clear' if os.name == 'posix' else 'cls') # Clear the terminal screen
            print("--- Real-Time Stock Prices ---")
            print(f"Last updated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
            print("---------------------------------")
            
            for name, symbol in tickers.items():
                price = get_stock_price(symbol)
                if isinstance(price, (int, float)):
                    print(f"{name} ({symbol}): ${price:,.2f}")
                else:
                    print(f"{name} ({symbol}): {price}")
            
            print("\n---------------------------------")
            print("Press Ctrl+C to stop.")
            time.sleep(10)  # Refresh every 10 seconds
            
    except KeyboardInterrupt:
        print("\n\nStopping price fetcher. Goodbye!")

if __name__ == "__main__":
    display_prices()
