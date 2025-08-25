from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import time
import numpy as np
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure requests session with retry strategy
def create_session_with_retries():
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

# Set up custom session for requests
session = create_session_with_retries()

app = Flask(__name__)

# Enhanced CORS configuration
CORS(app)


# Cache setup
cache = {}
cache_timestamp = 0
CACHE_DURATION_SECONDS = 60  # Cache for 60 seconds

# Add root endpoint
@app.route('/')
def root():
    return jsonify({
        'service': 'forex-data-service',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': [
            '/health',
            '/api/forex-data',
            '/api/bulk-forex-data',
            '/api/forex-price',
            '/api/bulk-forex-price',
            '/api/get-price',
            '/api/analyze-symbol'
        ]
    })

# Add health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'forex-data-service',
        'timestamp': time.time(),
        'cache_size': len(cache)
    })

def format_symbol_for_yfinance(symbol):
    """Format symbol for yfinance API"""
    # Crypto symbols in the list are like 'BTCUSDT'
    if symbol.endswith('USDT'):
        return f"{symbol[:-4]}-USD"

    # Forex symbols are like 'EUR/USD'
    if '/' in symbol:
        processed_symbol = symbol.replace('/', '')
        return f"{processed_symbol}=X"

    # Fallback for symbols without '/' that might be forex (e.g. from direct input)
    if len(symbol) == 6 and symbol.isalpha():
        return f"{symbol}=X"
        
    return symbol # Return as is if no specific format matches

def get_yfinance_interval(timeframe):
    """Maps frontend timeframe to a valid yfinance interval."""
    timeframe_map = {
        '1m': '1m',
        '3m': '2m',  # yfinance doesn't have '3m', falling back to '2m'
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '4h': '1h',  # yfinance doesn't have '4h', we can aggregate later if needed
        '1d': '1d',
        '1wk': '1wk',
        '1mo': '1mo',
    }
    return timeframe_map.get(timeframe, '1h') # Default to '1h' if not found


@app.route('/api/forex-data')
def get_forex_data():
    pair = request.args.get('pair')
    timeframe = request.args.get('timeframe', '1h')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not pair:
        return jsonify({'error': 'The "pair" parameter is required.'}), 400

    # Check if the pair is a crypto pair
    if pair.endswith('USDT'):
        try:
            data = get_binance_klines(pair, timeframe, start_date, end_date)
            data['time'] = data['time'].dt.strftime('%Y-%m-%d %H:%M:%S')
            return jsonify(data.to_dict(orient='records'))
        except Exception as e:
            logger.error(f"Error fetching Binance data for {pair}: {str(e)}")
            return jsonify({'error': f'An error occurred while fetching data for {pair}.'}), 500

    # Fallback to yfinance for non-crypto pairs
    formatted_pair = format_symbol_for_yfinance(pair)
    interval = get_yfinance_interval(timeframe)
    
    # Construct parameters for yfinance
    params = {'interval': interval}
    if start_date and end_date:
        params['start'] = start_date
        params['end'] = end_date
    else:
        # Default period if no date range is provided
        params['period'] = '1mo' if interval in ['1d', '1wk', '1mo'] else '7d'

    try:
        logger.info(f"Fetching data for {formatted_pair}")
        data = yf.download(
            tickers=formatted_pair,
            **params,
            auto_adjust=False,
            progress=False,
            timeout=30
        )

        if data.empty:
            logger.warning(f"No data found for {pair} with the specified parameters. Trying with a different period.")
            params['period'] = '1y' # Try with a longer period
            data = yf.download(
                tickers=formatted_pair,
                **params,
                auto_adjust=False,
                progress=False,
                timeout=30
            )

        if data.empty:
            return jsonify({'error': f'No data found for {pair} with the specified parameters.'}), 404

        data.reset_index(inplace=True)
        
        # Identify the correct timestamp column
        timestamp_col = 'Datetime' if 'Datetime' in data.columns else 'Date'
        
        # Standardize timestamp to UTC
        if data[timestamp_col].dt.tz:
            data[timestamp_col] = data[timestamp_col].dt.tz_convert('UTC')
        else:
            data[timestamp_col] = data[timestamp_col].dt.tz_localize('UTC')
        
        data['time'] = data[timestamp_col].dt.strftime('%Y-%m-%d %H:%M:%S')

        # Rename columns to be frontend-friendly
        data.rename(columns={
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        }, inplace=True)

        # Ensure all required columns are present
        required_cols = ['time', 'open', 'high', 'low', 'close']
        if 'volume' in data.columns:
            required_cols.append('volume')
        
        # Replace NaN with None for JSON compatibility
        data.replace({np.nan: None}, inplace=True)
        
        return jsonify(data[required_cols].to_dict('records'))

    except Exception as e:
        logger.error(f"Error fetching data for {pair}: {str(e)}")
        print(f"Error fetching data for {pair}: {str(e)}")
        return jsonify({'error': f'An error occurred while fetching data for {pair}. Please try again.'}), 500

@app.route('/api/bulk-forex-data')
def get_bulk_forex_data():
    pairs = request.args.get('pairs')
    timeframe = request.args.get('timeframe', '1h')
    
    if not pairs:
        return jsonify({'error': 'The "pairs" parameter is required.'}), 400

    pairs_list = pairs.split(',')
    results = {}

    for pair in pairs_list:
        if pair.endswith('USDT'):
            try:
                data = get_binance_klines(pair, timeframe)
                data['time'] = data['time'].dt.strftime('%Y-%m-%d %H:%M:%S')
                results[pair] = data.to_dict(orient='records')
            except Exception as e:
                logger.error(f"Error fetching Binance data for {pair}: {str(e)}")
                results[pair] = []
        else:
            # yfinance logic for non-crypto pairs
            formatted_pair = format_symbol_for_yfinance(pair)
            interval = get_yfinance_interval(timeframe)
            period = '1mo' if interval in ['1d', '1wk', '1mo'] else '7d'
            
            try:
                time.sleep(0.5) # Avoid rate limiting
                logger.info(f"Fetching data for single pair: {pair} ({formatted_pair})")
                ticker = yf.Ticker(formatted_pair)
                data = ticker.history(
                    period=period,
                    interval=interval,
                    auto_adjust=False
                )

                if not data.empty:
                    data = data.copy()
                    data.reset_index(inplace=True)
                    
                    timestamp_col = 'Datetime' if 'Datetime' in data.columns else 'Date'
                    
                    if data[timestamp_col].dt.tz:
                        data[timestamp_col] = data[timestamp_col].dt.tz_convert('UTC')
                    else:
                        data[timestamp_col] = data[timestamp_col].dt.tz_localize('UTC')
                    
                    data['time'] = data[timestamp_col].dt.strftime('%Y-%m-%d %H:%M:%S')

                    data.rename(columns={
                        'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'volume'
                    }, inplace=True)
                    
                    required_cols = ['time', 'open', 'high', 'low', 'close']
                    if 'volume' in data.columns:
                        required_cols.append('volume')
                    
                    data.replace({np.nan: None}, inplace=True)
                    results[pair] = data[required_cols].to_dict('records')
                else:
                    logger.warning(f"No data returned for {pair}")
                    results[pair] = []

            except Exception as e:
                logger.error(f"Error fetching data for {pair}: {str(e)}")
                results[pair] = []  # Mark failed pair

    return jsonify(results)

@app.route('/api/forex-price')
def get_forex_price():
    pair = request.args.get('pair')
    if not pair:
        return jsonify({'error': 'Pair parameter is missing.'}), 400

    if pair.endswith('USDT'):
        try:
            BINANCE_PRICE_URL = "https://api.binance.com/api/v3/ticker/price"
            params = {'symbol': pair}
            response = session.get(BINANCE_PRICE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            return jsonify({'pair': pair, 'price': float(data['price'])})
        except Exception as e:
            logger.error(f"Error fetching Binance price for {pair}: {str(e)}")
            return jsonify({'error': f'An error occurred while fetching price for {pair}.'}), 500

    formatted_pair = format_symbol_for_yfinance(pair)

    try:
        logger.info(f"Fetching price for {formatted_pair}")
        ticker = yf.Ticker(formatted_pair)
        
        # Try to get recent data first (more reliable)
        data = ticker.history(period='1d', interval='5m')
        if not data.empty and not data['Close'].dropna().empty:
            latest_price = data['Close'].dropna().iloc[-1]
            return jsonify({'pair': pair, 'price': float(latest_price)})
        
        # Fallback to ticker info
        try:
            info = ticker.info
            if info and isinstance(info, dict):
                price = info.get('regularMarketPrice') or info.get('bid') or info.get('ask')
                if price:
                    return jsonify({'pair': pair, 'price': float(price)})
        except Exception as info_error:
            logger.warning(f"Failed to get ticker info for {pair}: {str(info_error)}")
        
        return jsonify({'error': f'No price data found for {pair}'}), 404

    except Exception as e:
        logger.error(f"Error fetching price for {pair}: {str(e)}")
        print(f"Error fetching price for {pair}: {str(e)}")
        return jsonify({'error': f'An error occurred while fetching price for {pair}. Please try again.'}), 500

@app.route('/api/bulk-forex-price')
def get_bulk_forex_price():
    global cache, cache_timestamp
    current_time = time.time()
    
    pairs = request.args.get('pairs')
    if not pairs:
        return jsonify({'error': 'The "pairs" parameter is required.'}), 400
    
    pairs_list = list(set(pairs.split(',')))
    
    cached_results = {}
    pairs_to_fetch = []
    if current_time - cache_timestamp < CACHE_DURATION_SECONDS:
        for pair in pairs_list:
            if pair in cache:
                cached_results[pair] = cache[pair]
            else:
                pairs_to_fetch.append(pair)
    else:
        pairs_to_fetch = pairs_list
        cache.clear()

    if pairs_to_fetch:
        fetched_data = {}
        for pair in pairs_to_fetch:
            if pair.endswith('USDT'):
                try:
                    BINANCE_PRICE_URL = "https://api.binance.com/api/v3/ticker/price"
                    params = {'symbol': pair}
                    response = session.get(BINANCE_PRICE_URL, params=params)
                    response.raise_for_status()
                    data = response.json()
                    price_data = {'pair': pair, 'price': float(data['price'])}
                    fetched_data[pair] = price_data
                    cache[pair] = price_data
                except Exception as e:
                    logger.error(f"Error fetching Binance price for {pair}: {str(e)}")
                    fetched_data[pair] = {'error': 'Failed to fetch data.'}
            else:
                # yfinance logic for non-crypto pairs
                formatted_pair = format_symbol_for_yfinance(pair)
                try:
                    time.sleep(0.5) # Avoid rate limiting
                    logger.info(f"Fetching price for single pair: {pair} ({formatted_pair})")
                    ticker = yf.Ticker(formatted_pair)
                    data = ticker.history(period='1d', interval='1m', auto_adjust=True)

                    if not data.empty:
                        last_price = data['Close'].dropna().iloc[-1] if not data['Close'].dropna().empty else None
                        if last_price is not None and pd.notna(last_price):
                            price_data = {'pair': pair, 'price': last_price}
                            fetched_data[pair] = price_data
                            cache[pair] = price_data
                        else:
                            fetched_data[pair] = {'error': f'No recent price data for {pair}'}
                    else:
                        fetched_data[pair] = {'error': f'No data found for {pair}'}
                except Exception as e:
                    logger.error(f"Error fetching price for {pair}: {str(e)}")
                    fetched_data[pair] = {'error': 'Failed to fetch data.'}

        if fetched_data:
            cache_timestamp = time.time()

        cached_results.update(fetched_data)

    return jsonify(cached_results)

# Real-time price endpoint for single symbol
@app.route('/api/get-price', methods=['POST'])
def get_real_time_price():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid or missing JSON body.'}), 400
        symbol = data.get('symbol')
        timeframe = data.get('timeframe', '1m')
        
        if not symbol:
            return jsonify({'error': 'Symbol parameter is required.'}), 400

        # Check if the pair is a crypto pair
        if symbol.endswith('USDT'):
            try:
                data = get_binance_klines(symbol, timeframe, limit=1)
                if not data.empty:
                    latest_price = data['close'].iloc[-1]
                    return jsonify({
                        'symbol': symbol,
                        'price': float(latest_price),
                        'timestamp': data['time'].iloc[-1],
                        'source': 'binance'
                    })
                else:
                    return jsonify({'error': f'No data found for {symbol}'}), 404
            except Exception as e:
                logger.error(f"Error fetching Binance data for {symbol}: {str(e)}")
                return jsonify({'error': f'An error occurred while fetching data for {symbol}.'}), 500

        # Use yfinance for forex/commodities
        formatted_symbol = format_symbol_for_yfinance(symbol)
        
        try:
            logger.info(f"Fetching real-time price for {formatted_symbol}")
            ticker = yf.Ticker(formatted_symbol)
            
            # Get the most recent price data
            data = ticker.history(period='1d', interval='1m')
            if not data.empty:
                latest_price = data['Close'].iloc[-1]
                latest_time = data.index[-1]
                
                return jsonify({
                    'symbol': symbol,
                    'price': float(latest_price),
                    'timestamp': latest_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'source': 'yfinance'
                })
            else:
                return jsonify({'error': f'No recent data found for {symbol}'}), 404
                
        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {str(e)}")
            return jsonify({'error': f'An error occurred while fetching price for {symbol}.'}), 500
            
    except Exception as e:
        logger.error(f"Error in get_real_time_price: {str(e)}")
        return jsonify({'error': 'Invalid request format.'}), 400

# Symbol analysis endpoint for SMC analysis
@app.route('/api/analyze-symbol', methods=['POST'])
def analyze_symbol():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid or missing JSON body.'}), 400
        symbol = data.get('symbol')
        timeframe = data.get('timeframe', '15m')
        
        if not symbol:
            return jsonify({'error': 'Symbol parameter is required.'}), 400

        logger.info(f"Analyzing {symbol} on {timeframe}")
        
        # Get historical data for analysis
        if symbol.endswith('USDT'):
            # Use Binance for crypto
            historical_data = get_binance_klines(symbol, timeframe, limit=100)
        else:
            # Use yfinance for forex/commodities
            formatted_symbol = format_symbol_for_yfinance(symbol)
            interval = get_yfinance_interval(timeframe)
            
            ticker = yf.Ticker(formatted_symbol)
            historical_data = ticker.history(
                period='5d' if interval in ['1m', '2m', '5m'] else '1mo',
                interval=interval,
                auto_adjust=False
            )
            
            if not historical_data.empty:
                historical_data.reset_index(inplace=True)
                timestamp_col = 'Datetime' if 'Datetime' in historical_data.columns else 'Date'
                
                if historical_data[timestamp_col].dt.tz:
                    historical_data[timestamp_col] = historical_data[timestamp_col].dt.tz_convert('UTC')
                else:
                    historical_data[timestamp_col] = historical_data[timestamp_col].dt.tz_localize('UTC')
                
                historical_data['time'] = historical_data[timestamp_col]
                historical_data.rename(columns={
                    'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'volume'
                }, inplace=True)
        
        if historical_data.empty:
            return jsonify({
                'error': f'No historical data available for {symbol}',
                'signalType': 'NEUTRAL',
                'analysis': 'Insufficient data for analysis'
            }), 404
        
        # Perform basic SMC analysis
        analysis_result = perform_smc_analysis(historical_data, symbol, timeframe)
        
        return jsonify(analysis_result)
        
    except Exception as e:
        logger.error(f"Error analyzing symbol: {str(e)}")
        return jsonify({
            'error': f'Analysis failed: {str(e)}',
            'signalType': 'NEUTRAL',
            'analysis': 'Analysis error occurred'
        }), 500

def perform_smc_analysis(data, symbol, timeframe):
    """Perform Smart Money Concepts analysis on the data with enhanced primary confirmations"""
    try:
        if len(data) < 100:  # Need more data for proper swing point detection
            return {
                'signalType': 'NEUTRAL',
                'confidence': 0,
                'analysis': 'Insufficient data for reliable analysis (minimum 100 candles required)',
                'confirmations': [],
                'primaryConfirmations': [],
                'symbol': symbol,
                'timeframe': timeframe,
                'timestamp': pd.Timestamp.now().isoformat()
            }
        
        # Get current price
        current_price = float(data['close'].iloc[-1])
        
        # Calculate basic indicators
        highs = data['high'].values
        lows = data['low'].values
        closes = data['close'].values
        
        # Enhanced swing point detection - looking at 50 candles on each side for major swing points
        swing_lookback = min(50, len(data) // 4)  # Use 50 or quarter of data, whichever is smaller
        
        # Find major swing highs and lows
        major_swing_highs = []
        major_swing_lows = []
        
        # Detect swing points with proper lookback
        for i in range(swing_lookback, len(highs) - swing_lookback):
            # Check for swing high
            is_swing_high = True
            current_high = highs[i]
            for j in range(i - swing_lookback, i + swing_lookback + 1):
                if j != i and highs[j] >= current_high:
                    is_swing_high = False
                    break
            if is_swing_high:
                major_swing_highs.append({'index': i, 'price': current_high})
            
            # Check for swing low
            is_swing_low = True
            current_low = lows[i]
            for j in range(i - swing_lookback, i + swing_lookback + 1):
                if j != i and lows[j] <= current_low:
                    is_swing_low = False
                    break
            if is_swing_low:
                major_swing_lows.append({'index': i, 'price': current_low})
        
        # Get most recent swing points
        recent_swing_high = major_swing_highs[-1] if major_swing_highs else {'price': np.max(highs[-20:]), 'index': len(highs) - 10}
        recent_swing_low = major_swing_lows[-1] if major_swing_lows else {'price': np.min(lows[-20:]), 'index': len(lows) - 10}
        
        # Calculate ATR for volatility
        high_low = highs[1:] - lows[1:]
        high_close = np.abs(highs[1:] - closes[:-1])
        low_close = np.abs(lows[1:] - closes[:-1])
        true_range = np.maximum(high_low, np.maximum(high_close, low_close))
        atr = np.mean(true_range[-14:]) if len(true_range) >= 14 else np.mean(true_range)
        
        # Primary confirmations logic - these are generated when price breaks recent swing points
        primary_confirmations = []
        confirmations = []
        signal_type = 'NEUTRAL'
        confidence = 50
        
        # Check for PRIMARY CONFIRMATIONS - Break of recent swing high/low
        swing_high_price = recent_swing_high['price']
        swing_low_price = recent_swing_low['price']
        
        # Primary Confirmation: Bullish break of recent swing high
        if current_price > swing_high_price:
            primary_confirmations.append(f'PRIMARY: Bullish Break of Swing High at {swing_high_price:.5f}')
            confirmations.append('Bullish Break of Structure')
            signal_type = 'BUY'
            confidence += 30  # Higher confidence for primary confirmations
            
        # Primary Confirmation: Bearish break of recent swing low
        elif current_price < swing_low_price:
            primary_confirmations.append(f'PRIMARY: Bearish Break of Swing Low at {swing_low_price:.5f}')
            confirmations.append('Bearish Break of Structure')
            signal_type = 'SELL'
            confidence += 30  # Higher confidence for primary confirmations
        
        # Additional swing point analysis for multiple timeframe confirmation
        if len(major_swing_highs) >= 2 and len(major_swing_lows) >= 2:
            # Check for higher highs and higher lows (uptrend)
            if (major_swing_highs[-1]['price'] > major_swing_highs[-2]['price'] and 
                major_swing_lows[-1]['price'] > major_swing_lows[-2]['price']):
                confirmations.append('Higher Highs & Higher Lows Pattern')
                if signal_type == 'BUY':
                    confidence += 15
                    
            # Check for lower highs and lower lows (downtrend)
            elif (major_swing_highs[-1]['price'] < major_swing_highs[-2]['price'] and 
                  major_swing_lows[-1]['price'] < major_swing_lows[-2]['price']):
                confirmations.append('Lower Highs & Lower Lows Pattern')
                if signal_type == 'SELL':
                    confidence += 15
        
        # Market structure analysis
        recent_highs = highs[-10:]
        recent_lows = lows[-10:]
        
        # Check for premium/discount zones
        range_size = swing_high_price - swing_low_price
        current_level = (current_price - swing_low_price) / range_size if range_size > 0 else 0.5
        
        if current_level > 0.7:
            confirmations.append('Premium Zone (70%+ of range)')
            if signal_type == 'SELL':
                confidence += 10
        elif current_level < 0.3:
            confirmations.append('Discount Zone (30%- of range)')
            if signal_type == 'BUY':
                confidence += 10
        
        # Volume analysis if available
        if 'volume' in data.columns:
            recent_volume = data['volume'].iloc[-10:].mean()
            avg_volume = data['volume'].mean()
            if recent_volume > avg_volume * 1.5:
                confirmations.append('High Volume Confirmation')
                confidence += 10
        
        # Calculate trading levels
        if signal_type == 'BUY':
            entry_price = current_price
            stop_loss = swing_low_price - (atr * 0.5)
            take_profit = entry_price + ((entry_price - stop_loss) * 2)
        elif signal_type == 'SELL':
            entry_price = current_price
            stop_loss = swing_high_price + (atr * 0.5)
            take_profit = entry_price - ((stop_loss - entry_price) * 2)
        else:
            entry_price = current_price
            stop_loss = current_price - atr
            take_profit = current_price + atr
        
        # Generate analysis text
        if primary_confirmations:
            analysis = f"PRIMARY CONFIRMATION DETECTED: {signal_type} signal generated. "
            analysis += f"Price broke recent swing point at {swing_high_price if signal_type == 'BUY' else swing_low_price:.5f}. "
            analysis += f"Current price: {current_price:.5f}. "
            analysis += f"Additional confirmations: {', '.join(confirmations)}. "
            analysis += f"This is a high-probability {signal_type.lower()} setup based on swing point analysis."
        elif signal_type != 'NEUTRAL':
            analysis = f"SMC analysis indicates a {signal_type} opportunity. "
            analysis += f"Current price is at {current_price:.5f}. "
            analysis += f"Key confirmations: {', '.join(confirmations)}. "
            analysis += f"Market structure suggests {signal_type.lower()} momentum."
        else:
            analysis = f"Market is in consolidation phase. Current price: {current_price:.5f}. "
            analysis += f"Recent swing high: {swing_high_price:.5f}, Recent swing low: {swing_low_price:.5f}. "
            analysis += "Waiting for primary confirmation - break of recent swing high or low."
        
        return {
            'signalType': signal_type,
            'confidence': min(confidence, 95),
            'entryPrice': round(entry_price, 5),
            'stopLoss': round(stop_loss, 5),
            'takeProfit': round(take_profit, 5),
            'primaryRiskReward': '1:2',
            'confirmations': confirmations,
            'primaryConfirmations': primary_confirmations,  # New field for primary confirmations
            'swingHighPrice': round(swing_high_price, 5),
            'swingLowPrice': round(swing_low_price, 5),
            'analysis': analysis,
            'sessionQuality': get_session_quality(),
            'symbol': symbol,
            'timeframe': timeframe,
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in SMC analysis: {str(e)}")
        return {
            'signalType': 'NEUTRAL',
            'confidence': 0,
            'analysis': f'Analysis error: {str(e)}',
            'confirmations': [],
            'primaryConfirmations': [],
            'symbol': symbol,
            'timeframe': timeframe,
            'timestamp': pd.Timestamp.now().isoformat()
        }

def get_session_quality():
    """Determine current trading session quality"""
    import datetime
    now = datetime.datetime.utcnow()
    hour = now.hour
    
    if 7 <= hour <= 16:
        return 'London Session - High'
    elif 12 <= hour <= 21:
        return 'New York Session - High'
    elif 12 <= hour <= 16:
        return 'London/NY Overlap - Very High'
    else:
        return 'Asian Session - Medium'

def get_binance_klines(symbol, timeframe, start_date=None, end_date=None, limit=1000):
    """Enhanced Binance klines function with limit parameter"""
    BINANCE_API_URL = "https://api.binance.com/api/v3/klines"
    
    interval_map = {
        '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
        '1h': '1h', '4h': '4h', '1d': '1d', '1wk': '1w', '1mo': '1M',
    }
    binance_interval = interval_map.get(timeframe, '1h')

    params = {
        'symbol': symbol,
        'interval': binance_interval,
        'limit': limit
    }

    if start_date:
        params['startTime'] = int(pd.to_datetime(start_date).timestamp() * 1000)
    if end_date:
        params['endTime'] = int(pd.to_datetime(end_date).timestamp() * 1000)

    try:
        response = session.get(BINANCE_API_URL, params=params)
        response.raise_for_status()
        klines = response.json()

        if not klines:
            return pd.DataFrame()

        df = pd.DataFrame(klines, columns=[
            'time', 'open', 'high', 'low', 'close', 'volume', 'close_time',
            'quote_asset_volume', 'number_of_trades', 'taker_buy_base_asset_volume',
            'taker_buy_quote_asset_volume', 'ignore'
        ])
        df['time'] = pd.to_datetime(df['time'], unit='ms')
        df = df[['time', 'open', 'high', 'low', 'close', 'volume']].astype({
            'open': 'float', 'high': 'float', 'low': 'float', 'close': 'float', 'volume': 'float'
        })
        return df
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching Binance klines for {symbol}: {e}")
        return pd.DataFrame()

import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3004))
    app.run(host='0.0.0.0', port=port, debug=False)
