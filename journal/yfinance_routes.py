from flask import Blueprint, request, jsonify
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

yfinance_bp = Blueprint('yfinance', __name__)

def smooth_price(prices, window=5):
    """Apply moving average smoothing to remove price spikes"""
    if len(prices) < window:
        return prices
    
    # Use exponential moving average for better smoothing
    return list(pd.Series(prices).ewm(span=window).mean())

def validate_symbol(symbol):
    """Validate and normalize symbol format"""
    # Remove common prefixes/suffixes
    symbol = symbol.upper().strip()
    
    # Common symbol mappings
    symbol_mappings = {
        'BTC-USD': 'BTC-USD',
        'ETH-USD': 'ETH-USD',
        'EURUSD': 'EURUSD=X',
        'GBPUSD': 'GBPUSD=X',
        'USDJPY': 'USDJPY=X',
        'US30': '^DJI',
        'SPX': '^GSPC',
        'NAS': '^IXIC'
    }
    
    return symbol_mappings.get(symbol, symbol)

@yfinance_bp.route('/api/yfinance/price/<symbol>', methods=['GET'])
def get_price(symbol):
    """Get current price for a symbol with smoothing"""
    try:
        # Validate and normalize symbol
        normalized_symbol = validate_symbol(symbol)
        logger.info(f"Fetching price for {symbol} (normalized: {normalized_symbol})")
        
        # Fetch ticker data
        ticker = yf.Ticker(normalized_symbol)
        
        # Get recent price data for smoothing
        hist = ticker.history(period="1d", interval="1m")
        
        if hist.empty:
            logger.warning(f"No data received for {normalized_symbol}")
            return jsonify({'error': 'No data available'}), 404
        
        # Get the latest price
        latest_price = float(hist['Close'].iloc[-1])
        
        # Apply smoothing if we have enough data
        if len(hist) >= 5:
            prices = hist['Close'].tail(10).tolist()
            smoothed_prices = smooth_price(prices)
            latest_price = float(smoothed_prices[-1])
        
        # Validate price
        if not (0 < latest_price < 1000000):
            logger.warning(f"Invalid price received for {normalized_symbol}: {latest_price}")
            return jsonify({'error': 'Invalid price data'}), 500
        
        # Get additional info
        info = ticker.info
        previous_close = info.get('previousClose', latest_price)
        change = latest_price - previous_close
        change_percent = (change / previous_close) * 100 if previous_close > 0 else 0
        
        response_data = {
            'symbol': symbol,
            'price': round(latest_price, 6),
            'change': round(change, 6),
            'changePercent': round(change_percent, 2),
            'volume': int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
            'high': float(hist['High'].iloc[-1]) if 'High' in hist.columns else latest_price,
            'low': float(hist['Low'].iloc[-1]) if 'Low' in hist.columns else latest_price,
            'open': float(hist['Open'].iloc[-1]) if 'Open' in hist.columns else latest_price,
            'timestamp': datetime.now().isoformat(),
            'normalized_symbol': normalized_symbol
        }
        
        logger.info(f"Successfully fetched price for {symbol}: {latest_price}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error fetching price for {symbol}: {str(e)}")
        return jsonify({'error': f'Failed to fetch price: {str(e)}'}), 500

@yfinance_bp.route('/api/yfinance/ohlc/<symbol>', methods=['GET'])
def get_ohlc(symbol):
    """Get OHLC data for charting"""
    try:
        # Get query parameters
        interval = request.args.get('interval', '1d')
        period = request.args.get('period', '1mo')
        
        # Validate and normalize symbol
        normalized_symbol = validate_symbol(symbol)
        logger.info(f"Fetching OHLC for {symbol} (normalized: {normalized_symbol})")
        
        # Fetch ticker data
        ticker = yf.Ticker(normalized_symbol)
        hist = ticker.history(period=period, interval=interval)
        
        if hist.empty:
            logger.warning(f"No OHLC data received for {normalized_symbol}")
            return jsonify({'error': 'No data available'}), 404
        
        # Convert to list of dictionaries
        ohlc_data = []
        for index, row in hist.iterrows():
            ohlc_data.append({
                'timestamp': index.isoformat(),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume']) if 'Volume' in row else 0
            })
        
        logger.info(f"Successfully fetched {len(ohlc_data)} OHLC records for {symbol}")
        return jsonify(ohlc_data)
        
    except Exception as e:
        logger.error(f"Error fetching OHLC for {symbol}: {str(e)}")
        return jsonify({'error': f'Failed to fetch OHLC data: {str(e)}'}), 500

@yfinance_bp.route('/api/yfinance/multiple', methods=['POST'])
def get_multiple_prices():
    """Get prices for multiple symbols at once"""
    try:
        data = request.get_json()
        if not data or 'symbols' not in data:
            return jsonify({'error': 'Symbols list required'}), 400
        
        symbols = data['symbols']
        if not isinstance(symbols, list) or len(symbols) == 0:
            return jsonify({'error': 'Symbols must be a non-empty list'}), 400
        
        # Limit to prevent abuse
        if len(symbols) > 50:
            return jsonify({'error': 'Maximum 50 symbols allowed'}), 400
        
        results = []
        for symbol in symbols:
            try:
                # Use the existing price endpoint logic
                normalized_symbol = validate_symbol(symbol)
                ticker = yf.Ticker(normalized_symbol)
                hist = ticker.history(period="1d", interval="1m")
                
                if not hist.empty:
                    latest_price = float(hist['Close'].iloc[-1])
                    
                    # Apply smoothing
                    if len(hist) >= 5:
                        prices = hist['Close'].tail(10).tolist()
                        smoothed_prices = smooth_price(prices)
                        latest_price = float(smoothed_prices[-1])
                    
                    results.append({
                        'symbol': symbol,
                        'price': round(latest_price, 6),
                        'timestamp': datetime.now().isoformat(),
                        'success': True
                    })
                else:
                    results.append({
                        'symbol': symbol,
                        'error': 'No data available',
                        'success': False
                    })
                    
            except Exception as e:
                logger.warning(f"Failed to fetch price for {symbol}: {str(e)}")
                results.append({
                    'symbol': symbol,
                    'error': str(e),
                    'success': False
                })
        
        logger.info(f"Successfully fetched prices for {len([r for r in results if r['success']])}/{len(symbols)} symbols")
        return jsonify({'results': results})
        
    except Exception as e:
        logger.error(f"Error in multiple price fetch: {str(e)}")
        return jsonify({'error': f'Failed to fetch multiple prices: {str(e)}'}), 500

@yfinance_bp.route('/api/yfinance/validate/<symbol>', methods=['GET'])
def validate_symbol_endpoint(symbol):
    """Validate if a symbol exists and is supported"""
    try:
        normalized_symbol = validate_symbol(symbol)
        ticker = yf.Ticker(normalized_symbol)
        
        # Try to get basic info
        info = ticker.info
        if info and 'regularMarketPrice' in info:
            return jsonify({
                'symbol': symbol,
                'normalized_symbol': normalized_symbol,
                'valid': True,
                'name': info.get('longName', 'Unknown'),
                'exchange': info.get('exchange', 'Unknown'),
                'currency': info.get('currency', 'Unknown')
            })
        else:
            return jsonify({
                'symbol': symbol,
                'normalized_symbol': normalized_symbol,
                'valid': False,
                'error': 'Symbol not found or not supported'
            })
            
    except Exception as e:
        logger.error(f"Error validating symbol {symbol}: {str(e)}")
        return jsonify({
            'symbol': symbol,
            'valid': False,
            'error': str(e)
        })

@yfinance_bp.route('/api/yfinance/health', methods=['GET'])
def health_check():
    """Health check endpoint for yfinance service"""
    try:
        # Test with a simple symbol
        test_symbol = 'AAPL'
        ticker = yf.Ticker(test_symbol)
        hist = ticker.history(period="1d", interval="1m")
        
        if not hist.empty:
            return jsonify({
                'status': 'healthy',
                'service': 'yfinance',
                'test_symbol': test_symbol,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'status': 'unhealthy',
                'service': 'yfinance',
                'error': 'No data received from yfinance',
                'timestamp': datetime.now().isoformat()
            })
            
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'yfinance',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500
