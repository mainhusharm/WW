from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
import yfinance as yf
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

forex_bp = Blueprint('forex', __name__)


def _get_forex_price_from_yfinance(pair: str) -> float:
    """Get forex price from yfinance only with rate limit handling"""
    try:
        # Convert forex pair to yfinance symbol format
        if '/' in pair:
            symbol = pair.replace('/', '') + '=X'
        else:
            symbol = pair + '=X'
        
        logger.info(f"Fetching {pair} as {symbol} from yfinance")
        
        # Add delay to avoid rate limiting
        time.sleep(0.5)
        
        # Try simple download method first (most reliable)
        try:
            data = yf.download(symbol, period='1d', interval='1m', progress=False, timeout=10)
            if data is not None and not data.empty and len(data) > 0:
                price = data['Close'].iloc[-1]
                if price and price > 0:
                    logger.info(f"✅ yfinance download price for {pair}: {price}")
                    return float(price)
        except Exception as e:
            logger.debug(f"yfinance download failed for {pair}: {e}")
        
        # Try ticker history as fallback
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period='1d', interval='1m', timeout=10)
            if hist is not None and not hist.empty and len(hist) > 0:
                price = hist['Close'].iloc[-1]
                if price and price > 0:
                    logger.info(f"✅ yfinance history price for {pair}: {price}")
                    return float(price)
        except Exception as e:
            logger.debug(f"yfinance history failed for {pair}: {e}")
        
        # Try ticker info as last resort
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            if info and 'regularMarketPrice' in info and info['regularMarketPrice']:
                price = info['regularMarketPrice']
                if price and price > 0:
                    logger.info(f"✅ yfinance info price for {pair}: {price}")
                    return float(price)
        except Exception as e:
            logger.debug(f"yfinance info failed for {pair}: {e}")
        
    except Exception as e:
        logger.error(f"yfinance error for {pair}: {e}")
    
    return None


def _get_mock_price(pair: str) -> float:
    """Get realistic mock price for fallback"""
    mock_prices = {
        'EUR/USD': 1.0920, 'GBP/USD': 1.2780, 'USD/JPY': 148.50,
        'USD/CHF': 0.9150, 'AUD/USD': 0.6750, 'USD/CAD': 1.3550,
        'NZD/USD': 0.6150, 'EUR/GBP': 0.8550, 'EUR/JPY': 162.20,
        'GBP/JPY': 189.80, 'AUD/JPY': 100.20, 'CHF/JPY': 162.30,
        'CAD/JPY': 109.70, 'NZD/JPY': 91.30, 'EUR/CHF': 0.9980,
        'GBP/CHF': 1.1670, 'AUD/CHF': 0.6170, 'NZD/CHF': 0.5630,
        'EUR/CAD': 1.4790, 'GBP/CAD': 1.7280, 'AUD/CAD': 0.9140,
        'NZD/CAD': 0.8430
    }
    return mock_prices.get(pair, 1.0000)

@forex_bp.route('/forex-price')
@forex_bp.route('/forex-price/')
def get_forex_price():
    """Forex price fetcher using reliable external APIs"""
    try:
        pair = request.args.get('pair')
        if not pair:
            return jsonify({'error': 'Pair parameter is missing.'}), 400

        # Try to get real price from yfinance
        price = _get_forex_price_from_yfinance(pair)
        
        if price is not None:
            return jsonify({
                'pair': pair, 
                'price': round(price, 5), 
                'source': 'yfinance', 
                'timestamp': datetime.now().isoformat()
            })
        
        # Fallback to realistic mock price
        mock_price = _get_mock_price(pair)
        return jsonify({
            'pair': pair, 
            'price': round(mock_price, 5), 
            'source': 'fallback', 
            'timestamp': datetime.now().isoformat()
        })
            
    except Exception as e:
        logger.error(f"Error fetching price for {pair}: {str(e)}")
        # Emergency fallback
        mock_price = _get_mock_price(pair)
        return jsonify({
            'pair': pair, 
            'price': round(mock_price, 5), 
            'source': 'emergency_fallback', 
            'timestamp': datetime.now().isoformat()
        })

@forex_bp.route('/forex-data')
@forex_bp.route('/forex-data/')
def get_forex_data():
    """Simple forex data fetcher using yfinance"""
    try:
        pair = request.args.get('pair')
        if not pair:
            return jsonify({'error': 'Pair parameter is missing.'}), 400

        symbol = _format_symbol(pair)
        ticker = yf.Ticker(symbol)

        # Try multiple intervals for robustness
        history = None
        for interval in ['1h', '60m', '30m', '15m', '5m', '1d']:
            try:
                df = ticker.history(period='7d', interval=interval)
                if df is not None and not df.empty:
                    history = df
                    break
            except Exception as e:
                logger.debug(f"history fetch interval {interval} failed: {e}")
                continue
        
        if history is not None and not history.empty:
            # Convert to simple format
            result = []
            for index, row in history.iterrows():
                result.append({
                    'time': index.strftime('%Y-%m-%d %H:%M:%S'),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                    'volume': float(row['Volume'])
                })
            
            return jsonify(result)
        return jsonify({'pair': pair, 'error': 'No data available from yfinance'}), 502
            
    except Exception as e:
        logger.error(f"Error fetching data for {pair}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@forex_bp.route('/bulk-forex-price')
@forex_bp.route('/bulk-forex-price/')
def get_bulk_forex_price():
    """Fast bulk forex price fetcher using external APIs"""
    try:
        pairs = request.args.get('pairs')
        if not pairs:
            return jsonify({'error': 'Pairs parameter is missing.'}), 400
        
        pairs_list = [p.strip() for p in pairs.split(',') if p.strip()]
        results = {}
        
        # Process pairs individually with API calls
        for pair in pairs_list:
            try:
                # Try to get real price from yfinance
                price = _get_forex_price_from_yfinance(pair)
                
                if price is not None:
                    results[pair] = {
                        'pair': pair,
                        'price': round(price, 5),
                        'source': 'yfinance',
                        'timestamp': datetime.now().isoformat()
                    }
                else:
                    # Fallback to realistic mock price
                    mock_price = _get_mock_price(pair)
                    results[pair] = {
                        'pair': pair,
                        'price': round(mock_price, 5),
                        'source': 'fallback',
                        'timestamp': datetime.now().isoformat()
                    }
                    
            except Exception as e:
                # Emergency fallback
                mock_price = _get_mock_price(pair)
                results[pair] = {
                    'pair': pair,
                    'price': round(mock_price, 5),
                    'source': 'emergency_fallback',
                    'timestamp': datetime.now().isoformat()
                }
        
        logger.info(f"Bulk price fetch completed for {len(results)} pairs")
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Error in bulk forex price: {str(e)}")
        return jsonify({'error': str(e)}), 500

@forex_bp.route('/health')
@forex_bp.route('/health/')
def forex_health_check():
    """Simple health check with rate limiting info"""
    return jsonify({
        'status': 'healthy',
        'service': 'forex-data-service',
        'timestamp': datetime.now().isoformat(),
        'warning': 'Use /api/bulk-forex-price for multiple pairs to avoid rate limiting',
        'endpoints': [
            '/api/forex-price',
            '/api/forex-data',
            '/api/bulk-forex-price'
        ]
    })
