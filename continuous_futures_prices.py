#!/usr/bin/env python3
import yfinance as yf
import time
import os
from datetime import datetime
import colorama
from colorama import Fore, Back, Style

# Initialize colorama for colored output
colorama.init()

# Futures symbols with their display names
FUTURES_SYMBOLS = {
    'ES=F': 'S&P 500 Futures',
    'NQ=F': 'Nasdaq-100 Futures', 
    'YM=F': 'Dow Jones Futures',
    'RTY=F': 'Russell 2000 Futures',
    'CL=F': 'Crude Oil Futures',
    'GC=F': 'Gold Futures',
    'SI=F': 'Silver Futures',
    '6E=F': 'Euro FX Futures',
    '6B=F': 'British Pound Futures',
    '6J=F': 'Japanese Yen Futures'
}

def clear_screen():
    """Clear the terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')

def get_price_color(current, previous):
    """Return color based on price movement"""
    if current > previous:
        return Fore.GREEN
    elif current < previous:
        return Fore.RED
    else:
        return Fore.YELLOW

def format_price_change(current, previous):
    """Format price change with color and arrow"""
    if current > previous:
        change = current - previous
        return f"{Fore.GREEN}▲ +{change:.4f}{Style.RESET_ALL}"
    elif current < previous:
        change = previous - current
        return f"{Fore.RED}▼ -{change:.4f}{Style.RESET_ALL}"
    else:
        return f"{Fore.YELLOW}━ 0.0000{Style.RESET_ALL}"

def fetch_and_display_prices():
    """Fetch and display futures prices continuously"""
    previous_prices = {}
    update_count = 0
    
    print(f"{Fore.CYAN}{'='*80}")
    print(f"{Fore.CYAN}🚀 REAL-TIME FUTURES PRICE MONITOR 🚀")
    print(f"{'='*80}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}Press Ctrl+C to stop{Style.RESET_ALL}\n")
    
    while True:
        try:
            update_count += 1
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Clear screen every 10 updates for better readability
            if update_count % 10 == 1:
                clear_screen()
                print(f"{Fore.CYAN}{'='*80}")
                print(f"{Fore.CYAN}🚀 REAL-TIME FUTURES PRICE MONITOR 🚀")
                print(f"{'='*80}{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}Press Ctrl+C to stop{Style.RESET_ALL}\n")
            
            print(f"{Fore.MAGENTA}📊 Update #{update_count} - {current_time}{Style.RESET_ALL}")
            print(f"{Fore.CYAN}{'-'*80}{Style.RESET_ALL}")
            
            # Fetch all symbols at once for better performance
            tickers = yf.Tickers(' '.join(FUTURES_SYMBOLS.keys()))
            
            for symbol, name in FUTURES_SYMBOLS.items():
                try:
                    ticker = tickers.tickers[symbol]
                    info = ticker.info
                    hist = ticker.history(period="1d", interval="1m")
                    
                    if not hist.empty:
                        current_price = hist['Close'].iloc[-1]
                        
                        # Get previous price for comparison
                        previous_price = previous_prices.get(symbol, current_price)
                        
                        # Color based on price movement
                        price_color = get_price_color(current_price, previous_price)
                        change_display = format_price_change(current_price, previous_price)
                        
                        # Get additional info
                        volume = hist['Volume'].iloc[-1] if 'Volume' in hist.columns else 0
                        high_24h = hist['High'].max()
                        low_24h = hist['Low'].min()
                        
                        # Display formatted price info
                        print(f"{Fore.WHITE}{name:<25}{Style.RESET_ALL} | "
                              f"{price_color}{current_price:>10.4f}{Style.RESET_ALL} | "
                              f"{change_display} | "
                              f"{Fore.BLUE}Vol: {volume:>8,.0f}{Style.RESET_ALL} | "
                              f"{Fore.GREEN}H: {high_24h:.4f}{Style.RESET_ALL} | "
                              f"{Fore.RED}L: {low_24h:.4f}{Style.RESET_ALL}")
                        
                        # Store current price for next comparison
                        previous_prices[symbol] = current_price
                        
                except Exception as e:
                    print(f"{Fore.RED}{name:<25} | ERROR: {str(e)[:40]}...{Style.RESET_ALL}")
            
            print(f"{Fore.CYAN}{'-'*80}{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}💡 Next update in 5 seconds...{Style.RESET_ALL}\n")
            
            # Wait 5 seconds before next update
            time.sleep(5)
            
        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}🛑 Price monitoring stopped by user{Style.RESET_ALL}")
            break
        except Exception as e:
            print(f"{Fore.RED}❌ Error fetching prices: {e}{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}⏳ Retrying in 10 seconds...{Style.RESET_ALL}")
            time.sleep(10)

if __name__ == "__main__":
    print(f"{Fore.CYAN}🔄 Starting continuous futures price monitoring...{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}📡 Fetching data from Yahoo Finance API{Style.RESET_ALL}")
    print(f"{Fore.GREEN}✅ Monitoring 10 major futures contracts{Style.RESET_ALL}\n")
    
    fetch_and_display_prices()
