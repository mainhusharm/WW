from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid

admin_signals_bp = Blueprint('admin_signals', __name__)

# In-memory storage for admin signals (in production, use database)
admin_signals = []

@admin_signals_bp.route('/signals/admin', methods=['GET', 'POST', 'OPTIONS'])
def admin_signals_endpoint():
    if request.method == 'OPTIONS':
        return '', 200
    
    if request.method == 'POST':
        # Create new signal from admin
        try:
            data = request.get_json()
            
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
                'description': data.get('description', 'Admin-generated signal'),
                'confidence': int(data.get('confidence', 85)),
                'rrRatio': data.get('rrRatio', '1:2.7'),
                'analysis': data.get('analysis', 'Professional-grade signal analysis'),
                'createdBy': data.get('createdBy', 'Admin')
            }
            
            admin_signals.append(new_signal)
            
            return jsonify({
                'success': True,
                'message': 'Signal created successfully',
                'signal': new_signal
            }), 201
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    else:  # GET request
        # Return all admin signals (persist forever)
        return jsonify({
            'success': True,
            'signals': admin_signals,
            'total': len(admin_signals),
            'lastUpdated': datetime.utcnow().isoformat()
        })

@admin_signals_bp.route('/signals/admin/<signal_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
def manage_admin_signal(signal_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    # Find signal by ID
    signal = next((s for s in admin_signals if s['id'] == signal_id), None)
    
    if not signal:
        return jsonify({
            'success': False,
            'error': 'Signal not found'
        }), 404
    
    if request.method == 'PUT':
        # Update signal status
        try:
            data = request.get_json()
            signal['status'] = data.get('status', signal['status'])
            signal['updatedAt'] = datetime.utcnow().isoformat()
            
            return jsonify({
                'success': True,
                'message': 'Signal updated successfully',
                'signal': signal
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    elif request.method == 'DELETE':
        # Remove signal (admin only)
        admin_signals.remove(signal)
        
        return jsonify({
            'success': True,
            'message': 'Signal deleted successfully'
        })

@admin_signals_bp.route('/signals/admin/clear', methods=['POST', 'OPTIONS'])
def clear_all_signals():
    if request.method == 'OPTIONS':
        return '', 200
    
    # Clear all signals (admin only)
    admin_signals.clear()
    
    return jsonify({
        'success': True,
        'message': 'All signals cleared successfully'
    })
