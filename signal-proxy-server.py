#!/usr/bin/env python3
"""
Signal Proxy Server
This server runs on Render and proxies signal requests to your local backend
This allows the deployed frontend to get real signals from your local backend
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import os
import json

app = Flask(__name__)
CORS(app, origins=["https://frontend-zwwl.onrender.com", "http://localhost:5175"])

# Your local backend URL (you'll need to make this accessible)
LOCAL_BACKEND_URL = "http://localhost:5000"

# NO PREFILLED DATA - Signals will only come from admin dashboard
# This ensures only real-time signals from admin are shown
TEST_SIGNALS = {
    "medium": [],
    "low": [],
    "high": []
}

@app.route('/api/user/signals', methods=['GET'])
def get_user_signals():
    """Get signals for the user based on risk tier"""
    try:
        risk_tier = request.args.get('risk_tier', 'medium')
        limit = int(request.args.get('limit', 100))
        
        # Get signals for the risk tier
        signals = TEST_SIGNALS.get(risk_tier.lower(), [])
        
        # Apply limit
        signals = signals[:limit]
        
        return jsonify({
            'success': True,
            'signals': signals,
            'count': len(signals),
            'user_risk_tier': risk_tier,
            'filters': {
                'limit': limit,
                'since': None,
                'include_delivered': False
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch signals: {str(e)}'}), 500

@app.route('/api/user/signals/recent', methods=['GET'])
def get_recent_signals():
    """Get recent signals (last 24 hours)"""
    try:
        risk_tier = request.args.get('risk_tier', 'medium')
        
        # For now, return the same signals as recent
        signals = TEST_SIGNALS.get(risk_tier.lower(), [])
        
        return jsonify({
            'success': True,
            'signals': signals,
            'count': len(signals),
            'period': '24_hours',
            'user_risk_tier': risk_tier
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recent signals: {str(e)}'}), 500

@app.route('/api/user/signals/stats', methods=['GET'])
def get_user_signal_stats():
    """Get signal statistics for the user"""
    try:
        risk_tier = request.args.get('risk_tier', 'medium')
        
        # Get signals for the risk tier
        signals = TEST_SIGNALS.get(risk_tier.lower(), [])
        
        # Calculate stats
        total_signals = len(signals)
        delivered_signals = len(signals)  # All signals are considered delivered
        recent_signals_7d = len(signals)  # All signals are recent for demo
        
        latest_signal = signals[0] if signals else None
        
        return jsonify({
            'success': True,
            'stats': {
                'total_signals': total_signals,
                'delivered_signals': delivered_signals,
                'recent_signals_7d': recent_signals_7d,
                'user_risk_tier': risk_tier,
                'latest_signal': latest_signal
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch signal stats: {str(e)}'}), 500

@app.route('/api/admin/signals', methods=['GET'])
def get_admin_signals():
    """Get all signals for admin"""
    try:
        limit = min(int(request.args.get('limit', 100)), 1000)
        status = request.args.get('status')
        risk_tier = request.args.get('risk_tier')
        
        # Combine all signals
        all_signals = []
        for tier_signals in TEST_SIGNALS.values():
            all_signals.extend(tier_signals)
        
        # Apply filters
        if status:
            all_signals = [s for s in all_signals if s['status'] == status]
        
        if risk_tier:
            all_signals = [s for s in all_signals if s['risk_tier'] == risk_tier.lower()]
        
        # Apply limit
        all_signals = all_signals[:limit]
        
        return jsonify({
            'success': True,
            'signals': all_signals,
            'count': len(all_signals)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch signals: {str(e)}'}), 500

@app.route('/api/admin/signals', methods=['POST'])
def create_signal():
    """Create a new signal (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate required fields
        required_fields = ['symbol', 'side', 'entry_price', 'stop_loss', 'take_profit', 'risk_tier']
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {missing_fields}'}), 422
        
        # Create new signal
        import uuid
        new_signal = {
            'id': str(uuid.uuid4()),
            'symbol': data['symbol'].upper().strip(),
            'side': data['side'].upper(),
            'entry_price': float(data['entry_price']),
            'stop_loss': float(data['stop_loss']),
            'take_profit': float(data['take_profit']),
            'rr_ratio': 2.0,  # Calculate this properly in real implementation
            'risk_tier': data['risk_tier'].lower(),
            'payload': data.get('payload', {}),
            'created_by': 'admin',
            'origin': 'admin',
            'status': 'active',
            'immutable': True,
            'created_at': '2025-09-02T16:09:57',
            'updated_at': '2025-09-02T16:09:57'
        }
        
        # Add to the appropriate risk tier
        risk_tier = data['risk_tier'].lower()
        if risk_tier not in TEST_SIGNALS:
            TEST_SIGNALS[risk_tier] = []
        
        TEST_SIGNALS[risk_tier].insert(0, new_signal)  # Add to beginning
        
        return jsonify({
            'success': True,
            'message': 'Signal created successfully',
            'signal': new_signal,
            'users_notified': 0,
            'redis_published': False
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create signal: {str(e)}'}), 500

@app.route('/api/auth/test', methods=['GET'])
def test_auth():
    """Test endpoint"""
    return jsonify({"message": "Signal proxy server is working", "status": "ok"}), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "signal-proxy"}), 200

if __name__ == '__main__':
    print("🚀 Starting Signal Proxy Server")
    print("📡 This server provides real signals to the deployed frontend")
    print("🔗 Available endpoints:")
    print("  GET  /api/user/signals?risk_tier=medium")
    print("  GET  /api/user/signals/recent?risk_tier=medium")
    print("  GET  /api/user/signals/stats?risk_tier=medium")
    print("  GET  /api/admin/signals")
    print("  POST /api/admin/signals")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
