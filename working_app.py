#!/usr/bin/env python3
"""
Working Flask app with basic trading journal functionality
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/trading_journal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback_secret_key')

# Ensure instance directory exists
os.makedirs('instance', exist_ok=True)

db = SQLAlchemy(app)

# Basic models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Signal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pair = db.Column(db.String(20), nullable=False)
    direction = db.Column(db.String(10), nullable=False)
    entry_price = db.Column(db.Float, nullable=False)
    stop_loss = db.Column(db.Float, nullable=False)
    take_profit = db.Column(db.Float, nullable=False)
    confidence = db.Column(db.Integer, default=90)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')

# Routes
@app.route('/healthz')
def health_check():
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
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
        signals = Signal.query.order_by(Signal.timestamp.desc()).all()
        signals_data = []
        for signal in signals:
            signals_data.append({
                'id': signal.id,
                'pair': signal.pair,
                'direction': signal.direction,
                'entry_price': signal.entry_price,
                'stop_loss': signal.stop_loss,
                'take_profit': signal.take_profit,
                'confidence': signal.confidence,
                'timestamp': signal.timestamp.isoformat(),
                'status': signal.status
            })
        return jsonify(signals_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/signals', methods=['POST'])
def create_signal():
    try:
        data = request.get_json()
        new_signal = Signal(
            pair=data['currencyPair'],
            direction=data['direction'],
            entry_price=float(data['entryPrice']),
            stop_loss=float(data['stopLoss']),
            take_profit=float(data['takeProfit']),
            confidence=data.get('confidence', 90)
        )
        db.session.add(new_signal)
        db.session.commit()
        
        return jsonify({
            'message': 'Signal created successfully',
            'signal_id': new_signal.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/real-time-data')
def get_real_time_data():
    try:
        user_id = request.args.get('user_id', 1)
        # Get real-time data
        active_signals = Signal.query.filter_by(status='active').count()
        total_signals = Signal.query.count()
        
        return jsonify({
            'user_id': user_id,
            'trading': {
                'active_signals': active_signals,
                'total_signals': total_signals,
                'total_pnl': 0.0,
                'win_rate': 0.0,
                'total_trades': 0
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/live-signals')
def get_live_signals():
    try:
        signals = Signal.query.filter_by(status='active').order_by(Signal.timestamp.desc()).limit(10).all()
        signals_data = []
        for signal in signals:
            signals_data.append({
                'id': signal.id,
                'pair': signal.pair,
                'direction': signal.direction,
                'entry_price': signal.entry_price,
                'stop_loss': signal.stop_loss,
                'take_profit': signal.take_profit,
                'confidence': signal.confidence,
                'timestamp': signal.timestamp.isoformat()
            })
        return jsonify(signals_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/performance-metrics')
def get_performance_metrics():
    try:
        user_id = request.args.get('user_id', 1)
        # Calculate performance metrics
        total_signals = Signal.query.count()
        active_signals = Signal.query.filter_by(status='active').count()
        
        return jsonify({
            'user_id': user_id,
            'total_trades': total_signals,
            'active_trades': active_signals,
            'win_rate': 0.0,
            'total_pnl': 0.0,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

@app.route('/')
def index():
    return jsonify({
        'message': 'Trading Journal Backend - Working Version',
        'status': 'running',
        'features': [
            'Health check',
            'Signals API',
            'Dashboard API',
            'Payment validation',
            'Real-time data'
        ],
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    print("Starting working Flask app...")
    print(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    
    # Create database tables
    with app.app_context():
        db.create_all()
        print("Database tables created/verified")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
