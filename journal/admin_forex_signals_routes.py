from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import json

admin_forex_signals_bp = Blueprint('admin_forex_signals', __name__)

# In-memory storage for admin forex signals (in production, use database)
admin_forex_signals = []

@admin_forex_signals_bp.route('/admin/forex/generate-signal', methods=['POST', 'OPTIONS'])
def generate_forex_signal():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        # Create new forex signal from admin dashboard
        new_signal = {
            'id': str(uuid.uuid4()),
            'symbol': data.get('symbol', 'EUR/USD'),
            'action': data.get('action', 'BUY'),
            'entryPrice': float(data.get('entryPrice', 1.0850)),
            'stopLoss': float(data.get('stopLoss', 1.0800)),
            'takeProfit': float(data.get('takeProfit', 1.0950)),
            'timeframe': data.get('timeframe', '1H'),
            'status': 'active',
            'createdAt': datetime.utcnow().isoformat(),
            'description': data.get('description', 'Forex signal from admin dashboard'),
            'confidence': int(data.get('confidence', 85)),
            'rrRatio': data.get('rrRatio', '1:2.7'),
            'analysis': data.get('analysis', 'Professional forex analysis'),
            'createdBy': 'Admin Forex Dashboard',
            'signalType': 'forex',
            'marketSession': data.get('marketSession', 'London'),
            'economicImpact': data.get('economicImpact', 'Medium')
        }
        
        # Add to forex signals list
        admin_forex_signals.append(new_signal)
        
        # Use enhanced signal system to deliver to users
        from .enhanced_signal_system import SignalDeliveryService
        delivery_result = SignalDeliveryService.create_signal_from_admin(new_signal, 'forex')
        
        if not delivery_result['success']:
            print(f"Warning: Signal delivery failed: {delivery_result.get('error', 'Unknown error')}")
        
        # Also add to main admin signals list for user dashboard
        from .admin_signals_routes import admin_signals
        admin_signals.append(new_signal)
        
        print(f"Forex signal created from admin dashboard: {new_signal['symbol']}")
        
        return jsonify({
            'success': True,
            'message': 'Forex signal generated successfully',
            'signal': new_signal
        }), 201
        
    except Exception as e:
        print(f"Error generating forex signal: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@admin_forex_signals_bp.route('/admin/forex/signals', methods=['GET', 'OPTIONS'])
def get_forex_signals():
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        'success': True,
        'signals': admin_forex_signals,
        'total': len(admin_forex_signals),
        'lastUpdated': datetime.utcnow().isoformat()
    })

@admin_forex_signals_bp.route('/admin/forex/bulk-generate', methods=['POST', 'OPTIONS'])
def bulk_generate_forex_signals():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        symbols = data.get('symbols', ['EUR/USD', 'GBP/USD', 'USD/JPY'])
        action = data.get('action', 'BUY')
        
        generated_signals = []
        
        for symbol in symbols:
            # Generate signal for each symbol
            new_signal = {
                'id': str(uuid.uuid4()),
                'symbol': symbol,
                'action': action,
                'entryPrice': 1.0850 + (hash(symbol) % 100) / 10000,  # Vary entry price
                'stopLoss': 1.0800 + (hash(symbol) % 100) / 10000,
                'takeProfit': 1.0950 + (hash(symbol) % 100) / 10000,
                'timeframe': '1H',
                'status': 'active',
                'createdAt': datetime.utcnow().isoformat(),
                'description': f'Bulk generated {action} signal for {symbol}',
                'confidence': 85,
                'rrRatio': '1:2.7',
                'analysis': f'Professional analysis for {symbol}',
                'createdBy': 'Admin Forex Dashboard',
                'signalType': 'forex',
                'marketSession': 'London',
                'economicImpact': 'Medium'
            }
            
            admin_forex_signals.append(new_signal)
            
            # Use enhanced signal system to deliver to users
            from .enhanced_signal_system import SignalDeliveryService
            delivery_result = SignalDeliveryService.create_signal_from_admin(new_signal, 'forex')
            
            if not delivery_result['success']:
                print(f"Warning: Bulk signal delivery failed: {delivery_result.get('error', 'Unknown error')}")
            
            # Also add to main admin signals list
            from .admin_signals_routes import admin_signals
            admin_signals.append(new_signal)
            
            generated_signals.append(new_signal)
        
        print(f"Bulk generated {len(generated_signals)} forex signals")
        
        return jsonify({
            'success': True,
            'message': f'Bulk generated {len(generated_signals)} forex signals',
            'signals': generated_signals
        }), 201
        
    except Exception as e:
        print(f"Error bulk generating forex signals: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
