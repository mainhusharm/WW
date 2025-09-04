#!/usr/bin/env python3
"""
Simple working Flask app for testing basic functionality
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# In-memory storage for testing
signals = []
users = []
questionnaires = {}

# Routes
@app.route('/healthz')
def health_check():
    try:
        return jsonify({
            'status': 'healthy',
            'database': 'connected (in-memory)',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@app.route('/api/signals', methods=['GET'])
def get_signals():
    try:
        return jsonify(signals), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/signals', methods=['POST'])
def create_signal():
    try:
        data = request.get_json()
        new_signal = {
            'id': len(signals) + 1,
            'pair': data['currencyPair'],
            'direction': data['direction'],
            'entry_price': float(data['entryPrice']),
            'stop_loss': float(data['stopLoss']),
            'take_profit': float(data['takeProfit']),
            'confidence': data.get('confidence', 90),
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'active'
        }
        signals.append(new_signal)
        
        return jsonify({
            'message': 'Signal created successfully',
            'signal_id': new_signal['id']
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/real-time-data')
def get_real_time_data():
    try:
        user_id = request.args.get('user_id', 1)
        active_signals = len([s for s in signals if s['status'] == 'active'])
        total_signals = len(signals)
        
        return jsonify({
            'user_id': user_id,
            'user': {
                'id': user_id,
                'name': f'User {user_id}',
                'email': f'user{user_id}@example.com',
                'status': 'active'
            },
            'trading': {
                'active_signals': active_signals,
                'total_signals': total_signals,
                'total_pnl': 0.0,
                'win_rate': 0.0,
                'total_trades': total_signals
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/live-signals')
def get_live_signals():
    try:
        active_signals = [s for s in signals if s['status'] == 'active']
        return jsonify({
            'signals': active_signals[:10],
            'count': len(active_signals),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/performance-metrics')
def get_performance_metrics():
    try:
        user_id = request.args.get('user_id', 1)
        total_signals = len(signals)
        active_signals = len([s for s in signals if s['status'] == 'active'])
        
        return jsonify({
            'user_id': user_id,
            'metrics': {
                'total_trades': total_signals,
                'winning_trades': 0,
                'losing_trades': 0,
                'win_rate': 0.0,
                'total_pnl': 0.0
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 200

@app.route('/api/payment/validate-coupon', methods=['POST'])
def validate_coupon():
    try:
        data = request.get_json()
        coupon_code = data.get('coupon_code')
        plan_id = data.get('plan_id', 'pro')
        original_price = data.get('original_price', 29.99)
        
        if coupon_code == 'TRADERFREE':
            return jsonify({
                'valid': True,
                'discount_amount': original_price,
                'final_price': 0.00,
                'message': 'Free access coupon applied!'
            }), 200
        elif coupon_code == 'INTERNAL_DEV_OVERRIDE_2024':
            return jsonify({
                'valid': True,
                'discount_amount': original_price - 0.10,
                'final_price': 0.10,
                'message': 'Development override coupon applied!'
            }), 200
        else:
            return jsonify({
                'valid': False,
                'error': 'Invalid coupon code'
            }), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/questionnaire', methods=['POST'])
def submit_questionnaire():
    try:
        data = request.get_json()
        user_id = data.get('user_id', 1)
        
        questionnaire_data = {
            'user_id': user_id,
            'account_type': data.get('account_type', 'QuantTekel Instant'),
            'package_value': data.get('package_value', 100),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        questionnaires[user_id] = questionnaire_data
        
        return jsonify({
            'message': 'Questionnaire submitted successfully',
            'user_id': user_id,
            'data': questionnaire_data
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/questionnaire/<int:user_id>', methods=['GET'])
def get_questionnaire(user_id):
    try:
        if user_id in questionnaires:
            return jsonify(questionnaires[user_id]), 200
        else:
            return jsonify({'error': 'Questionnaire not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/yfinance/price/<symbol>')
def get_price(symbol):
    try:
        # Mock price data for testing
        import random
        price = 100 + random.uniform(-10, 10)
        return jsonify({
            'symbol': symbol,
            'price': round(price, 2),
            'change': round(random.uniform(-5, 5), 2),
            'changePercent': round(random.uniform(-5, 5), 2),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return jsonify({
        'message': 'Trading Journal Backend - Simple Working Version',
        'status': 'running',
        'features': [
            'Health check',
            'Signals API (in-memory)',
            'Dashboard API',
            'Payment validation',
            'Real-time data',
            'YFinance mock data'
        ],
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    print("Starting simple working Flask app...")
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    print("Features: In-memory storage, no database required")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
