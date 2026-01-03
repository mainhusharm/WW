#!/usr/bin/env python3
"""
Minimal setup script for the real-time signal system (no Redis dependency)
This script will:
1. Run database migrations
2. Create test users with risk tiers
3. Create test signals
4. Test the basic functionality
"""

import os
import sys
import uuid
from datetime import datetime

# Add the journal directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'journal'))

def setup_database():
    """Run database migrations and create tables"""
    print("🔧 Setting up database...")
    
    try:
        from journal.__init___minimal import create_app_minimal, db
        
        app = create_app_minimal()
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✅ Database tables created")
            
            # Check if signals table exists
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
                
            return True
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

def create_test_users():
    """Create test users with different risk tiers"""
    print("👥 Creating test users...")
    
    try:
        from journal.__init___minimal import create_app_minimal, db
        from journal.models import User
        
        app = create_app_minimal()
        with app.app_context():
            # Create test users with different risk tiers
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
            return created_users
    except Exception as e:
        print(f"❌ Failed to create test users: {e}")
        return []

def create_test_signals():
    """Create test signals for different risk tiers"""
    print("📡 Creating test signals...")
    
    try:
        from journal.__init___minimal import create_app_minimal, db
        from journal.models import User
        
        app = create_app_minimal()
        with app.app_context():
            # Get admin user
            admin_user = User.query.filter_by(email='admin@example.com').first()
            if not admin_user:
                print("❌ Admin user not found")
                return []
            
            # Create test signals for different risk tiers
            test_signals = [
                {
                    'symbol': 'BTCUSD',
                    'side': 'buy',
                    'entry_price': 46000.0,
                    'stop_loss': 45500.0,
                    'take_profit': 48000.0,
                    'risk_tier': 'medium',
                    'payload': {
                        'timeframe': '1H',
                        'analysis': 'Strong bullish momentum with key support at 45500',
                        'confidence': 85
                    }
                },
                {
                    'symbol': 'EURUSD',
                    'side': 'sell',
                    'entry_price': 1.0850,
                    'stop_loss': 1.0900,
                    'take_profit': 1.0750,
                    'risk_tier': 'low',
                    'payload': {
                        'timeframe': '4H',
                        'analysis': 'Conservative short position with tight risk management',
                        'confidence': 90
                    }
                },
                {
                    'symbol': 'ETHUSD',
                    'side': 'buy',
                    'entry_price': 3000.0,
                    'stop_loss': 2800.0,
                    'take_profit': 3500.0,
                    'risk_tier': 'high',
                    'payload': {
                        'timeframe': '1H',
                        'analysis': 'Aggressive long position with high risk/reward',
                        'confidence': 75
                    }
                }
            ]
            
            created_signals = []
            for signal_data in test_signals:
                # Create signal manually to avoid Redis dependency
                from journal.signal_models import Signal
                
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
            return created_signals
    except Exception as e:
        print(f"❌ Failed to create test signals: {e}")
        return []

def create_user_signal_mappings():
    """Create user-signal mappings for all users"""
    print("🔗 Creating user-signal mappings...")
    
    try:
        from journal.__init___minimal import create_app_minimal, db
        from journal.models import User
        from journal.signal_models import Signal, UserSignal
        
        app = create_app_minimal()
        with app.app_context():
            # Get all users and signals
            users = User.query.all()
            signals = Signal.query.all()
            
            mappings_created = 0
            for user in users:
                for signal in signals:
                    # Only create mapping if user's risk tier matches signal's risk tier
                    if user.risk_tier == signal.risk_tier:
                        # Check if mapping already exists
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
    except Exception as e:
        print(f"❌ Failed to create user-signal mappings: {e}")

def test_signal_api():
    """Test signal API endpoints"""
    print("🌐 Testing signal API endpoints...")
    
    try:
        from journal.__init___minimal import create_app_minimal, db
        from journal.models import User
        from journal.signal_models import Signal
        
        app = create_app_minimal()
        with app.app_context():
            # Test getting signals for a user
            user = User.query.filter_by(risk_tier='medium').first()
            if user:
                signals = Signal.query.filter(
                    Signal.risk_tier == user.risk_tier.lower(),
                    Signal.status == 'active',
                    Signal.origin == 'admin'
                ).order_by(Signal.created_at.desc()).all()
                
                print(f"✅ Found {len(signals)} signals for user {user.email}")
                
                for signal in signals:
                    print(f"   - {signal.symbol} {signal.side} (R:R {signal.rr_ratio:.2f})")
            else:
                print("❌ No medium risk tier user found")
    except Exception as e:
        print(f"❌ Failed to test signal API: {e}")

def main():
    """Main setup function"""
    print("🚀 Setting up Real-time Signal System")
    print("=" * 50)
    
    # Step 1: Setup database
    if not setup_database():
        print("❌ Database setup failed")
        return
    
    # Step 2: Create test users
    users = create_test_users()
    if not users:
        print("❌ Failed to create test users")
        return
    
    # Step 3: Create test signals
    signals = create_test_signals()
    if not signals:
        print("❌ Failed to create test signals")
        return
    
    # Step 4: Create user-signal mappings
    create_user_signal_mappings()
    
    # Step 5: Test signal API
    test_signal_api()
    
    print("\n" + "=" * 50)
    print("✅ Real-time Signal System setup complete!")
    print("\n📋 Next steps:")
    print("1. Install Redis: brew install redis (macOS) or apt install redis-server (Ubuntu)")
    print("2. Start Redis: redis-server")
    print("3. Install Python dependencies: pip install redis flask-socketio")
    print("4. Start the backend server: python journal/run_journal.py")
    print("5. Open the frontend and check the signals tab")
    
    print("\n🔑 Test user credentials:")
    print("- testuser_medium@example.com (medium risk tier)")
    print("- testuser_low@example.com (low risk tier)")
    print("- testuser_high@example.com (high risk tier)")
    print("- admin@example.com (admin user)")

if __name__ == '__main__':
    main()
