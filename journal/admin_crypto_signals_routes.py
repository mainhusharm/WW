from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import json

admin_crypto_signals_bp = Blueprint('admin_crypto_signals', __name__)

# In-memory storage for admin crypto signals (in production, use database)
admin_crypto_signals = []

@admin_crypto_signals_bp.route('/admin/crypto/generate-signal', methods=['POST', 'OPTIONS'])
def generate_crypto_signal():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        # Create new crypto signal from admin dashboard
        new_signal = {
            'id': str(uuid.uuid4()),
            'symbol': data.get('symbol', 'BTC/USDT'),
            'action': data.get('action', 'BUY'),
            'entryPrice': float(data.get('entryPrice', 45000.00)),
            'stopLoss': float(data.get('stopLoss', 44000.00)),
            'takeProfit': float(data.get('takeProfit', 47000.00)),
            'timeframe': data.get('timeframe', '4H'),
            'status': 'active',
            'createdAt': datetime.utcnow().isoformat(),
            'description': data.get('description', 'Crypto signal from admin dashboard'),
            'confidence': int(data.get('confidence', 88)),
            'rrRatio': data.get('rrRatio', '1:2.0'),
            'analysis': data.get('analysis', 'Professional crypto analysis'),
            'createdBy': 'Admin Crypto Dashboard',
            'signalType': 'crypto',
            'marketCap': data.get('marketCap', 'Large Cap'),
            'volatility': data.get('volatility', 'High')
        }
        
        # Add to crypto signals list
        admin_crypto_signals.append(new_signal)
        
        # Use enhanced signal system to deliver to users
        from .enhanced_signal_system import SignalDeliveryService
        delivery_result = SignalDeliveryService.create_signal_from_admin(new_signal, 'crypto')
        
        if not delivery_result['success']:
            print(f"Warning: Signal delivery failed: {delivery_result.get('error', 'Unknown error')}")
        
        # Also add to main admin signals list for user dashboard
        from .admin_signals_routes import admin_signals
        admin_signals.append(new_signal)
        
        print(f"Crypto signal created from admin dashboard: {new_signal['symbol']}")
        
        return jsonify({
            'success': True,
            'message': 'Crypto signal generated successfully',
            'signal': new_signal
        }), 201
        
    except Exception as e:
        print(f"Error generating crypto signal: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@admin_crypto_signals_bp.route('/admin/crypto/signals', methods=['GET', 'OPTIONS'])
def get_crypto_signals():
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        'success': True,
        'signals': admin_crypto_signals,
        'total': len(admin_crypto_signals),
        'lastUpdated': datetime.utcnow().isoformat()
    })

@admin_crypto_signals_bp.route('/admin/crypto/bulk-generate', methods=['POST', 'OPTIONS'])
def bulk_generate_crypto_signals():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        symbols = data.get('symbols', ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'])
        action = data.get('action', 'BUY')
        
        generated_signals = []
        
        for symbol in symbols:
            # Generate signal for each symbol
            base_price = 45000 if 'BTC' in symbol else 3000 if 'ETH' in symbol else 300
            
            new_signal = {
                'id': str(uuid.uuid4()),
                'symbol': symbol,
                'action': action,
                'entryPrice': base_price + (hash(symbol) % 1000),
                'stopLoss': base_price - 1000 + (hash(symbol) % 1000),
                'takeProfit': base_price + 2000 + (hash(symbol) % 1000),
                'timeframe': '4H',
                'status': 'active',
                'createdAt': datetime.utcnow().isoformat(),
                'description': f'Bulk generated {action} signal for {symbol}',
                'confidence': 88,
                'rrRatio': '1:2.0',
                'analysis': f'Professional crypto analysis for {symbol}',
                'createdBy': 'Admin Crypto Dashboard',
                'signalType': 'crypto',
                'marketCap': 'Large Cap',
                'volatility': 'High'
            }
            
            admin_crypto_signals.append(new_signal)
            
            # Use enhanced signal system to deliver to users
            from .enhanced_signal_system import SignalDeliveryService
            delivery_result = SignalDeliveryService.create_signal_from_admin(new_signal, 'crypto')
            
            if not delivery_result['success']:
                print(f"Warning: Bulk signal delivery failed: {delivery_result.get('error', 'Unknown error')}")
            
            # Also add to main admin signals list
            from .admin_signals_routes import admin_signals
            admin_signals.append(new_signal)
            
            generated_signals.append(new_signal)
        
        print(f"Bulk generated {len(generated_signals)} crypto signals")
        
        return jsonify({
            'success': True,
            'message': f'Bulk generated {len(generated_signals)} crypto signals',
            'signals': generated_signals
        }), 201
        
    except Exception as e:
        print(f"Error bulk generating crypto signals: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
