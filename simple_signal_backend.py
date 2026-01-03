#!/usr/bin/env python3
"""
Simple signal backend without Redis dependencies
This provides the basic API endpoints for the signal system
"""

import os
import sys
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import json

# Set environment to use SQLite
os.environ['DATABASE_URL'] = 'sqlite:///trading_bots.db'

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['JWT_SECRET_KEY'] = 'dev-jwt-secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///trading_bots.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# Define models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=True)
    unique_id = db.Column(db.String(6), unique=True, nullable=False)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    normalized_email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))
    active_session_id = db.Column(db.String(255), nullable=True, unique=True)
    plan_type = db.Column(db.String(20), nullable=False, default='free')
    risk_tier = db.Column(db.String(20), nullable=True, default='medium')
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    last_login = db.Column(db.DateTime, nullable=True)
    consent_accepted = db.Column(db.Boolean, nullable=False, default=False)
    consent_timestamp = db.Column(db.DateTime, nullable=True)
    account_screenshot_url = db.Column(db.String(255), nullable=True)
    reset_token = db.Column(db.String(100), nullable=True, unique=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if not self.unique_id:
            self.unique_id = self.generate_unique_id()
        if not self.uuid:
            self.uuid = str(uuid.uuid4())
        if self.email and not self.normalized_email:
            self.normalized_email = self.email.lower().strip()
    
    @staticmethod
    def generate_unique_id():
        import random
        return str(random.randint(100000, 999999))

class Signal(db.Model):
    __tablename__ = 'signals'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = db.Column(db.String(50), nullable=False)
    side = db.Column(db.String(10), nullable=False)
    entry_price = db.Column(db.Float, nullable=True)
    stop_loss = db.Column(db.Float, nullable=True)
    take_profit = db.Column(db.Float, nullable=True)
    rr_ratio = db.Column(db.Float, nullable=True)
    risk_tier = db.Column(db.String(20), nullable=False)
    payload = db.Column(db.Text, nullable=False, default='{}')
    created_by = db.Column(db.String(36), nullable=False)
    origin = db.Column(db.String(20), nullable=False, default='admin')
    status = db.Column(db.String(20), nullable=False, default='active')
    immutable = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    
    def to_dict(self):
        """Convert signal to dictionary for JSON serialization"""
        try:
            payload_data = json.loads(self.payload) if self.payload else {}
        except:
            payload_data = {}
        
        return {
            'id': str(self.id),
            'symbol': self.symbol,
            'side': self.side,
            'entry_price': self.entry_price,
            'stop_loss': self.stop_loss,
            'take_profit': self.take_profit,
            'rr_ratio': self.rr_ratio,
            'risk_tier': self.risk_tier,
            'payload': payload_data,
            'created_by': str(self.created_by),
            'origin': self.origin,
            'status': self.status,
            'immutable': self.immutable,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class UserSignal(db.Model):
    __tablename__ = 'user_signals'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    signal_id = db.Column(db.String(36), nullable=False)
    delivered = db.Column(db.Boolean, default=False)
    delivered_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

# Routes
@app.route('/api/auth/test', methods=['GET'])
def test_auth():
    """Test endpoint"""
    return jsonify({"message": "Signal backend is working", "status": "ok"}), 200

@app.route('/api/user/signals', methods=['GET'])
def get_user_signals():
    """Get signals for the authenticated user"""
    try:
        # For now, return signals for medium risk tier users
        # In a real implementation, you'd get the user from JWT token
        user_risk_tier = request.args.get('risk_tier', 'medium')
        
        # Get signals matching the user's risk tier
        signals = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin'
        ).order_by(Signal.created_at.desc()).limit(100).all()
        
        signals_data = [signal.to_dict() for signal in signals]
        
        return jsonify({
            'success': True,
            'signals': signals_data,
            'count': len(signals_data),
            'user_risk_tier': user_risk_tier,
            'filters': {
                'limit': 100,
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
        user_risk_tier = request.args.get('risk_tier', 'medium')
        
        # Get signals from last 24 hours
        from datetime import datetime, timedelta
        since_date = datetime.utcnow() - timedelta(hours=24)
        
        signals = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin',
            Signal.created_at >= since_date
        ).order_by(Signal.created_at.desc()).all()
        
        signals_data = [signal.to_dict() for signal in signals]
        
        return jsonify({
            'success': True,
            'signals': signals_data,
            'count': len(signals_data),
            'period': '24_hours',
            'user_risk_tier': user_risk_tier
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recent signals: {str(e)}'}), 500

@app.route('/api/user/signals/stats', methods=['GET'])
def get_user_signal_stats():
    """Get signal statistics for the user"""
    try:
        user_risk_tier = request.args.get('risk_tier', 'medium')
        
        # Get user's signal statistics
        total_signals = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin'
        ).count()
        
        # Get delivered signals count
        delivered_count = db.session.query(UserSignal).join(Signal).filter(
            UserSignal.delivered == True,
            Signal.status == 'active',
            Signal.origin == 'admin'
        ).count()
        
        # Get recent signals (last 7 days)
        from datetime import datetime, timedelta
        since_date = datetime.utcnow() - timedelta(days=7)
        recent_signals = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin',
            Signal.created_at >= since_date
        ).count()
        
        # Get latest signal
        latest_signal = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin'
        ).order_by(Signal.created_at.desc()).first()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_signals': total_signals,
                'delivered_signals': delivered_count,
                'recent_signals_7d': recent_signals,
                'user_risk_tier': user_risk_tier,
                'latest_signal': latest_signal.to_dict() if latest_signal else None
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
        
        # Build query
        query = Signal.query.filter_by(origin='admin')
        
        if status:
            query = query.filter_by(status=status)
        
        if risk_tier:
            query = query.filter_by(risk_tier=risk_tier.lower())
        
        # Execute query
        signals = query.order_by(Signal.created_at.desc()).limit(limit).all()
        
        # Convert to dict
        signals_data = [signal.to_dict() for signal in signals]
        
        return jsonify({
            'success': True,
            'signals': signals_data,
            'count': len(signals_data)
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
        
        # Validate side
        if data['side'].lower() not in ['buy', 'sell']:
            return jsonify({'error': 'Side must be "buy" or "sell"'}), 422
        
        # Validate risk tier
        if data['risk_tier'].lower() not in ['low', 'medium', 'high']:
            return jsonify({'error': 'Risk tier must be "low", "medium", or "high"'}), 422
        
        # Calculate risk:reward ratio
        entry_price = float(data['entry_price'])
        stop_loss = float(data['stop_loss'])
        take_profit = float(data['take_profit'])
        side = data['side'].lower()
        
        rr_ratio = None
        if entry_price and stop_loss and take_profit:
            if side == 'buy':
                risk = abs(entry_price - stop_loss)
                reward = abs(take_profit - entry_price)
            else:  # sell
                risk = abs(stop_loss - entry_price)
                reward = abs(entry_price - take_profit)
            
            if risk > 0:
                rr_ratio = reward / risk
        
        # Create signal
        signal = Signal(
            symbol=data['symbol'].upper().strip(),
            side=data['side'].upper(),
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            rr_ratio=rr_ratio,
            risk_tier=data['risk_tier'].lower(),
            payload=json.dumps(data.get('payload', {})),
            created_by='admin',  # In real implementation, get from JWT
            origin='admin',
            status='active',
            immutable=True
        )
        
        db.session.add(signal)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Signal created successfully',
            'signal': signal.to_dict(),
            'users_notified': 0,  # Would be calculated in real implementation
            'redis_published': False  # Would be True in real implementation
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create signal: {str(e)}'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database tables created/verified")
    
    print("🚀 Starting Simple Signal Backend on http://localhost:5000")
    print("📡 Available endpoints:")
    print("  GET  /api/auth/test")
    print("  GET  /api/user/signals?risk_tier=medium")
    print("  GET  /api/user/signals/recent?risk_tier=medium")
    print("  GET  /api/user/signals/stats?risk_tier=medium")
    print("  GET  /api/admin/signals")
    print("  POST /api/admin/signals")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
