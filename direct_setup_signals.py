#!/usr/bin/env python3
"""
Direct setup script for the real-time signal system
This script directly creates the database tables and test data without Redis dependencies
"""

import os
import sys
import uuid
from datetime import datetime

# Set environment to use SQLite
os.environ['DATABASE_URL'] = 'sqlite:///trading_bots.db'

def setup_database_direct():
    """Set up database directly without Redis dependencies"""
    print("🔧 Setting up database directly...")
    
    try:
        # Import Flask and SQLAlchemy directly
        from flask import Flask
        from flask_sqlalchemy import SQLAlchemy
        from flask_jwt_extended import JWTManager
        from flask_cors import CORS
        
        # Create minimal Flask app
        app = Flask(__name__)
        app.config['SECRET_KEY'] = 'dev-secret-key'
        app.config['JWT_SECRET_KEY'] = 'dev-jwt-secret'
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///trading_bots.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        # Initialize extensions
        db = SQLAlchemy(app)
        jwt = JWTManager(app)
        CORS(app)
        
        # Define User model
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
        
        # Define Signal model
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
        
        # Define UserSignal model
        class UserSignal(db.Model):
            __tablename__ = 'user_signals'
            id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
            user_id = db.Column(db.String(36), nullable=False)
            signal_id = db.Column(db.String(36), nullable=False)
            delivered = db.Column(db.Boolean, default=False)
            delivered_at = db.Column(db.DateTime, nullable=True)
            created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
        
        # Create all tables
        with app.app_context():
            db.create_all()
            print("✅ Database tables created")
            
            # Check if tables exist
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'signals' in tables:
                print("✅ Signals table exists")
            else:
                print("❌ Signals table not found")
                return False
                
            if 'user_signals' in tables:
                print("✅ User signals table exists")
            else:
                print("❌ User signals table not found")
                return False
                
            return True, app, db, User, Signal, UserSignal
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False, None, None, None, None, None

def create_test_data(app, db, User, Signal, UserSignal):
    """Create test users and signals"""
    print("👥 Creating test users and signals...")
    
    try:
        with app.app_context():
            # Create test users
            test_users = [
                {
                    'username': 'testuser_low',
                    'email': 'testuser_low@example.com',
                    'password_hash': 'hashed_password',
                    'plan_type': 'pro',
                    'risk_tier': 'low'
                },
                {
                    'username': 'testuser_medium',
                    'email': 'testuser_medium@example.com',
                    'password_hash': 'hashed_password',
                    'plan_type': 'pro',
                    'risk_tier': 'medium'
                },
                {
                    'username': 'testuser_high',
                    'email': 'testuser_high@example.com',
                    'password_hash': 'hashed_password',
                    'plan_type': 'pro',
                    'risk_tier': 'high'
                },
                {
                    'username': 'admin_user',
                    'email': 'admin@example.com',
                    'password_hash': 'hashed_password',
                    'plan_type': 'enterprise',
                    'risk_tier': 'medium'
                }
            ]
            
            created_users = []
            for user_data in test_users:
                # Check if user already exists
                existing_user = User.query.filter_by(email=user_data['email']).first()
                if existing_user:
                    print(f"⚠️  User {user_data['email']} already exists")
                    created_users.append(existing_user)
                    continue
                
                user = User(
                    username=user_data['username'],
                    email=user_data['email'],
                    password_hash=user_data['password_hash'],
                    plan_type=user_data['plan_type'],
                    risk_tier=user_data['risk_tier']
                )
                
                db.session.add(user)
                created_users.append(user)
                print(f"✅ Created user: {user_data['email']} (risk_tier: {user_data['risk_tier']})")
            
            db.session.commit()
            
            # Create test signals
            admin_user = User.query.filter_by(email='admin@example.com').first()
            if not admin_user:
                print("❌ Admin user not found")
                return False
            
            test_signals = [
                {
                    'symbol': 'BTCUSD',
                    'side': 'buy',
                    'entry_price': 46000.0,
                    'stop_loss': 45500.0,
                    'take_profit': 48000.0,
                    'risk_tier': 'medium',
                    'payload': '{"timeframe": "1H", "analysis": "Strong bullish momentum with key support at 45500", "confidence": 85}'
                },
                {
                    'symbol': 'EURUSD',
                    'side': 'sell',
                    'entry_price': 1.0850,
                    'stop_loss': 1.0900,
                    'take_profit': 1.0750,
                    'risk_tier': 'low',
                    'payload': '{"timeframe": "4H", "analysis": "Conservative short position with tight risk management", "confidence": 90}'
                },
                {
                    'symbol': 'ETHUSD',
                    'side': 'buy',
                    'entry_price': 3000.0,
                    'stop_loss': 2800.0,
                    'take_profit': 3500.0,
                    'risk_tier': 'high',
                    'payload': '{"timeframe": "1H", "analysis": "Aggressive long position with high risk/reward", "confidence": 75}'
                }
            ]
            
            created_signals = []
            for signal_data in test_signals:
                # Calculate risk:reward ratio
                entry_price = signal_data['entry_price']
                stop_loss = signal_data['stop_loss']
                take_profit = signal_data['take_profit']
                side = signal_data['side']
                
                rr_ratio = None
                if entry_price and stop_loss and take_profit:
                    if side.lower() == 'buy':
                        risk = abs(entry_price - stop_loss)
                        reward = abs(take_profit - entry_price)
                    else:  # sell
                        risk = abs(stop_loss - entry_price)
                        reward = abs(entry_price - take_profit)
                    
                    if risk > 0:
                        rr_ratio = reward / risk
                
                signal = Signal(
                    symbol=signal_data['symbol'],
                    side=signal_data['side'].upper(),
                    entry_price=entry_price,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    rr_ratio=rr_ratio,
                    risk_tier=signal_data['risk_tier'].lower(),
                    payload=signal_data['payload'],
                    created_by=str(admin_user.uuid),
                    origin='admin',
                    status='active',
                    immutable=True
                )
                
                db.session.add(signal)
                created_signals.append(signal)
                print(f"✅ Created signal: {signal_data['symbol']} {signal_data['side']} (risk_tier: {signal_data['risk_tier']})")
            
            db.session.commit()
            
            # Create user-signal mappings
            mappings_created = 0
            for user in created_users:
                for signal in created_signals:
                    if user.risk_tier == signal.risk_tier:
                        existing = UserSignal.query.filter_by(
                            user_id=str(user.uuid),
                            signal_id=str(signal.id)
                        ).first()
                        
                        if not existing:
                            user_signal = UserSignal(
                                user_id=str(user.uuid),
                                signal_id=str(signal.id),
                                delivered=False
                            )
                            db.session.add(user_signal)
                            mappings_created += 1
            
            db.session.commit()
            print(f"✅ Created {mappings_created} user-signal mappings")
            
            return True
    except Exception as e:
        print(f"❌ Failed to create test data: {e}")
        return False

def test_data():
    """Test the created data"""
    print("🧪 Testing created data...")
    
    try:
        from flask import Flask
        from flask_sqlalchemy import SQLAlchemy
        
        app = Flask(__name__)
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///trading_bots.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        db = SQLAlchemy(app)
        
        class User(db.Model):
            __tablename__ = 'users'
            id = db.Column(db.Integer, primary_key=True)
            uuid = db.Column(db.String(36), unique=True, nullable=True)
            email = db.Column(db.String(120), unique=True, nullable=False)
            risk_tier = db.Column(db.String(20), nullable=True, default='medium')
        
        class Signal(db.Model):
            __tablename__ = 'signals'
            id = db.Column(db.String(36), primary_key=True)
            symbol = db.Column(db.String(50), nullable=False)
            side = db.Column(db.String(10), nullable=False)
            risk_tier = db.Column(db.String(20), nullable=False)
            status = db.Column(db.String(20), nullable=False, default='active')
            origin = db.Column(db.String(20), nullable=False, default='admin')
        
        with app.app_context():
            # Test getting signals for a user
            user = User.query.filter_by(risk_tier='medium').first()
            if user:
                signals = Signal.query.filter(
                    Signal.risk_tier == user.risk_tier.lower(),
                    Signal.status == 'active',
                    Signal.origin == 'admin'
                ).all()
                
                print(f"✅ Found {len(signals)} signals for user {user.email}")
                
                for signal in signals:
                    print(f"   - {signal.symbol} {signal.side} (risk_tier: {signal.risk_tier})")
            else:
                print("❌ No medium risk tier user found")
    except Exception as e:
        print(f"❌ Failed to test data: {e}")

def main():
    """Main setup function"""
    print("🚀 Setting up Real-time Signal System")
    print("=" * 50)
    
    # Step 1: Setup database
    success, app, db, User, Signal, UserSignal = setup_database_direct()
    if not success:
        print("❌ Database setup failed")
        return
    
    # Step 2: Create test data
    if not create_test_data(app, db, User, Signal, UserSignal):
        print("❌ Failed to create test data")
        return
    
    # Step 3: Test data
    test_data()
    
    print("\n" + "=" * 50)
    print("✅ Real-time Signal System setup complete!")
    print("\n📋 Next steps:")
    print("1. Start the backend server: python journal/run_journal.py")
    print("2. Open the frontend and check the signals tab")
    print("3. You should now see signals in the user dashboard!")
    
    print("\n🔑 Test user credentials:")
    print("- testuser_medium@example.com (medium risk tier)")
    print("- testuser_low@example.com (low risk tier)")
    print("- testuser_high@example.com (high risk tier)")
    print("- admin@example.com (admin user)")

if __name__ == '__main__':
    main()
