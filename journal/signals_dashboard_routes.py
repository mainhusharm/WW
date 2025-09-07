from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid

signals_dashboard_bp = Blueprint('signals_dashboard', __name__)

@signals_dashboard_bp.route('/signals/dashboard', methods=['GET', 'OPTIONS'])
def get_signals_dashboard():
    """Get signals for dashboard with proper format"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        signal_type = request.args.get('type', 'all')
        limit = int(request.args.get('limit', 20))
        
        # Generate mock signals with proper format
        signals = generate_mock_signals(signal_type, limit)
        
        return jsonify({ 
            'success': True,
            'signals': signals,
            'total': len(signals),
            'lastUpdated': datetime.utcnow().isoformat()
        })
        
    except Exception as error:
        print(f'Error fetching signals dashboard: {error}')
        return jsonify({ 
            'success': False,
            'error': str(error) 
        }), 500

def generate_mock_signals(signal_type, limit):
    """Generate mock signals with proper format"""
    base_signals = [
        {
            'id': 'signal-1',
            'type': 'forex',
            'symbol': 'EUR/USD',
            'action': 'buy',
            'entry': '1.0850',
            'stopLoss': '1.0800',
            'takeProfit': '1.0950',
            'confidence': 85,
            'source': 'forex_bot',
            'status': 'active',
            'createdAt': (datetime.utcnow() - timedelta(minutes=30)).isoformat(),
            'expiresAt': (datetime.utcnow() + timedelta(hours=23)).isoformat(),
            'analysis': 'Strong bullish momentum with RSI oversold bounce',
            'performance': {
                'views': 45,
                'trades': 12,
                'successRate': 78
            }
        },
        {
            'id': 'signal-2',
            'type': 'crypto',
            'symbol': 'BTC/USDT',
            'action': 'sell',
            'entry': '43250',
            'stopLoss': '43800',
            'takeProfit': '42500',
            'confidence': 72,
            'source': 'crypto_bot',
            'status': 'active',
            'createdAt': (datetime.utcnow() - timedelta(minutes=15)).isoformat(),
            'expiresAt': (datetime.utcnow() + timedelta(hours=23)).isoformat(),
            'analysis': 'Resistance at 43500 with bearish divergence',
            'performance': {
                'views': 32,
                'trades': 8,
                'successRate': 65
            }
        },
        {
            'id': 'signal-3',
            'type': 'forex',
            'symbol': 'GBP/USD',
            'action': 'buy',
            'entry': '1.2650',
            'stopLoss': '1.2600',
            'takeProfit': '1.2750',
            'confidence': 90,
            'source': 'forex_bot',
            'status': 'active',
            'createdAt': (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
            'expiresAt': (datetime.utcnow() + timedelta(hours=23)).isoformat(),
            'analysis': 'Breakout above key resistance with volume confirmation',
            'performance': {
                'views': 28,
                'trades': 15,
                'successRate': 82
            }
        },
        {
            'id': 'signal-4',
            'type': 'forex',
            'symbol': 'USD/JPY',
            'action': 'sell',
            'entry': '149.50',
            'stopLoss': '150.00',
            'takeProfit': '148.50',
            'confidence': 78,
            'source': 'forex_bot',
            'status': 'active',
            'createdAt': (datetime.utcnow() - timedelta(minutes=45)).isoformat(),
            'expiresAt': (datetime.utcnow() + timedelta(hours=23)).isoformat(),
            'analysis': 'Bearish divergence on 4H chart with resistance at 150.00',
            'performance': {
                'views': 38,
                'trades': 9,
                'successRate': 71
            }
        },
        {
            'id': 'signal-5',
            'type': 'crypto',
            'symbol': 'ETH/USDT',
            'action': 'buy',
            'entry': '2650',
            'stopLoss': '2600',
            'takeProfit': '2750',
            'confidence': 82,
            'source': 'crypto_bot',
            'status': 'active',
            'createdAt': (datetime.utcnow() - timedelta(minutes=10)).isoformat(),
            'expiresAt': (datetime.utcnow() + timedelta(hours=23)).isoformat(),
            'analysis': 'Bullish flag pattern with strong support at 2600',
            'performance': {
                'views': 41,
                'trades': 11,
                'successRate': 76
            }
        }
    ]
    
    # Filter by type if specified
    if signal_type != 'all':
        filtered_signals = [s for s in base_signals if s['type'] == signal_type]
        return filtered_signals[:limit]
    
    return base_signals[:limit]
