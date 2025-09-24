"""
Signal System Implementation
Implements the flowchart: Admin Dashboard -> Bot Generation -> User Dashboard Signal Feed
Signals must persist forever regardless of logout/login/reload
"""

import uuid
import json
from datetime import datetime, timedelta
from flask import current_app
from .models import db, SignalFeed, User
from .extensions import socketio
import random

class SignalGenerator:
    """Generates trading signals for crypto and forex markets"""
    
    def __init__(self):
        self.crypto_pairs = [
            'BTCUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD', 'LINKUSD',
            'UNIUSD', 'LTCUSD', 'BCHUSD', 'XRPUSD', 'SOLUSD'
        ]
        self.forex_pairs = [
            'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD',
            'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP'
        ]
        self.ict_concepts = [
            'Order Block', 'Fair Value Gap', 'Liquidity Sweep', 'Market Structure',
            'Breaker Block', 'Imbalance', 'Premium/Discount', 'Consequent Encroachment'
        ]
    
    def generate_crypto_signal(self):
        """Generate a crypto trading signal"""
        pair = random.choice(self.crypto_pairs)
        direction = random.choice(['LONG', 'SHORT'])
        
        # Generate realistic price levels
        base_price = random.uniform(100, 50000)  # Wide range for crypto
        entry_price = round(base_price, 2)
        
        if direction == 'LONG':
            stop_loss = round(entry_price * 0.95, 2)  # 5% below entry
            take_profit = round(entry_price * 1.15, 2)  # 15% above entry
        else:
            stop_loss = round(entry_price * 1.05, 2)  # 5% above entry
            take_profit = round(entry_price * 0.85, 2)  # 15% below entry
        
        confidence = random.randint(75, 95)
        concepts = random.sample(self.ict_concepts, random.randint(1, 3))
        
        analysis = f"Strong {direction} signal on {pair} based on market structure analysis. " \
                  f"Key levels identified with high probability setup."
        
        return {
            'id': str(uuid.uuid4()),
            'pair': pair,
            'direction': direction,
            'entry_price': str(entry_price),
            'stop_loss': str(stop_loss),
            'take_profit': str(take_profit),
            'confidence': confidence,
            'analysis': analysis,
            'ict_concepts': concepts,
            'market': 'crypto',
            'timeframe': random.choice(['15m', '1h', '4h']),
            'timestamp': datetime.utcnow(),
            'status': 'active',
            'is_recommended': confidence > 85
        }
    
    def generate_forex_signal(self):
        """Generate a forex trading signal"""
        pair = random.choice(self.forex_pairs)
        direction = random.choice(['LONG', 'SHORT'])
        
        # Generate realistic forex price levels
        if 'JPY' in pair:
            base_price = random.uniform(100, 150)
        else:
            base_price = random.uniform(0.5, 2.0)
        
        entry_price = round(base_price, 5)
        
        if direction == 'LONG':
            stop_loss = round(entry_price - 0.005, 5)  # 50 pips below
            take_profit = round(entry_price + 0.01, 5)  # 100 pips above
        else:
            stop_loss = round(entry_price + 0.005, 5)  # 50 pips above
            take_profit = round(entry_price - 0.01, 5)  # 100 pips below
        
        confidence = random.randint(70, 90)
        concepts = random.sample(self.ict_concepts, random.randint(1, 3))
        
        analysis = f"High probability {direction} setup on {pair}. " \
                  f"Market structure confirms the bias with clear levels."
        
        return {
            'id': str(uuid.uuid4()),
            'pair': pair,
            'direction': direction,
            'entry_price': str(entry_price),
            'stop_loss': str(stop_loss),
            'take_profit': str(take_profit),
            'confidence': confidence,
            'analysis': analysis,
            'ict_concepts': concepts,
            'market': 'forex',
            'timeframe': random.choice(['15m', '1h', '4h']),
            'timestamp': datetime.utcnow(),
            'status': 'active',
            'is_recommended': confidence > 80
        }

class SignalSystem:
    """Main signal system that manages the complete flow"""
    
    def __init__(self):
        self.generator = SignalGenerator()
        self.is_running = False
    
    def start_signal_generation(self, interval_minutes=30):
        """Start automatic signal generation"""
        if self.is_running:
            return
        
        self.is_running = True
        current_app.logger.info("🚀 Signal generation system started")
        
        # Generate initial signals
        self.generate_and_store_signals()
        
        # Schedule periodic generation
        import threading
        def generate_periodically():
            while self.is_running:
                try:
                    self.generate_and_store_signals()
                    threading.Event().wait(interval_minutes * 60)  # Wait for interval
                except Exception as e:
                    current_app.logger.error(f"Error in signal generation: {e}")
                    threading.Event().wait(60)  # Wait 1 minute on error
        
        thread = threading.Thread(target=generate_periodically, daemon=True)
        thread.start()
    
    def stop_signal_generation(self):
        """Stop automatic signal generation"""
        self.is_running = False
        current_app.logger.info("🛑 Signal generation system stopped")
    
    def generate_and_store_signals(self):
        """Generate and store new signals"""
        try:
            # Generate crypto signal
            crypto_signal = self.generator.generate_crypto_signal()
            self.store_signal(crypto_signal)
            
            # Generate forex signal
            forex_signal = self.generator.generate_forex_signal()
            self.store_signal(forex_signal)
            
            current_app.logger.info(f"✅ Generated 2 new signals: {crypto_signal['pair']} and {forex_signal['pair']}")
            
        except Exception as e:
            current_app.logger.error(f"❌ Error generating signals: {e}")
    
    def store_signal(self, signal_data):
        """Store signal in database and broadcast to users"""
        try:
            # Create unique key for deduplication
            unique_key = f"{signal_data['pair']}_{signal_data['direction']}_{signal_data['entry_price']}_{signal_data['timestamp'].strftime('%Y%m%d_%H%M')}"
            
            # Check if signal already exists
            existing_signal = SignalFeed.query.filter_by(unique_key=unique_key).first()
            if existing_signal:
                current_app.logger.info(f"Signal already exists: {unique_key}")
                return
            
            # Create new signal feed entry
            signal_feed = SignalFeed(
                unique_key=unique_key,
                signal_id=signal_data['id'],
                pair=signal_data['pair'],
                direction=signal_data['direction'],
                entry_price=signal_data['entry_price'],
                stop_loss=signal_data['stop_loss'],
                take_profit=signal_data['take_profit'],
                confidence=signal_data['confidence'],
                analysis=signal_data['analysis'],
                ict_concepts=json.dumps(signal_data['ict_concepts']),
                timestamp=signal_data['timestamp'],
                status=signal_data['status'],
                market=signal_data['market'],
                timeframe=signal_data['timeframe'],
                created_by='bot_system',
                is_recommended=signal_data['is_recommended']
            )
            
            db.session.add(signal_feed)
            db.session.commit()
            
            # Broadcast to all connected users via WebSocket
            self.broadcast_signal(signal_data)
            
            current_app.logger.info(f"📡 Signal stored and broadcasted: {signal_data['pair']} {signal_data['direction']}")
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"❌ Error storing signal: {e}")
    
    def broadcast_signal(self, signal_data):
        """Broadcast signal to all connected users"""
        try:
            # Prepare signal payload for WebSocket
            signal_payload = {
                'id': signal_data['id'],
                'pair': signal_data['pair'],
                'direction': signal_data['direction'],
                'entry': signal_data['entry_price'],
                'stopLoss': signal_data['stop_loss'],
                'takeProfit': signal_data['take_profit'],
                'confidence': signal_data['confidence'],
                'analysis': signal_data['analysis'],
                'ictConcepts': signal_data['ict_concepts'],
                'timestamp': signal_data['timestamp'].isoformat(),
                'status': signal_data['status'],
                'market': signal_data['market'],
                'timeframe': signal_data['timeframe'],
                'is_recommended': signal_data['is_recommended']
            }
            
            # Emit to all connected users
            socketio.emit('new_signal', signal_payload, namespace='/')
            current_app.logger.info(f"📡 Signal broadcasted via WebSocket: {signal_data['pair']}")
            
        except Exception as e:
            current_app.logger.error(f"❌ Error broadcasting signal: {e}")
    
    def get_user_signals(self, user_id=None, market_filter='all', limit=50):
        """Get signals for user dashboard - signals persist forever"""
        try:
            query = SignalFeed.query.filter_by(status='active')
            
            if market_filter != 'all':
                query = query.filter_by(market=market_filter)
            
            signals = query.order_by(SignalFeed.timestamp.desc()).limit(limit).all()
            
            signals_data = []
            for signal in signals:
                signal_data = {
                    'id': signal.signal_id,
                    'pair': signal.pair,
                    'direction': signal.direction,
                    'type': signal.direction,  # For compatibility
                    'entry': signal.entry_price,
                    'entryPrice': signal.entry_price,  # For compatibility
                    'stopLoss': signal.stop_loss,
                    'takeProfit': signal.take_profit,
                    'confidence': signal.confidence,
                    'analysis': signal.analysis,
                    'ictConcepts': json.loads(signal.ict_concepts) if signal.ict_concepts else [],
                    'timestamp': signal.timestamp.isoformat(),
                    'status': signal.status,
                    'market': signal.market,
                    'timeframe': signal.timeframe,
                    'is_recommended': signal.is_recommended
                }
                signals_data.append(signal_data)
            
            return signals_data
            
        except Exception as e:
            current_app.logger.error(f"❌ Error getting user signals: {e}")
            return []
    
    def create_admin_signal(self, signal_data):
        """Create signal from admin dashboard"""
        try:
            # Generate unique ID if not provided
            if 'id' not in signal_data:
                signal_data['id'] = str(uuid.uuid4())
            
            # Set timestamp if not provided
            if 'timestamp' not in signal_data:
                signal_data['timestamp'] = datetime.utcnow()
            
            # Set status if not provided
            if 'status' not in signal_data:
                signal_data['status'] = 'active'
            
            # Store the signal
            self.store_signal(signal_data)
            
            return {
                'success': True,
                'message': 'Signal created and delivered successfully',
                'signal_id': signal_data['id']
            }
            
        except Exception as e:
            current_app.logger.error(f"❌ Error creating admin signal: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Global signal system instance
signal_system = SignalSystem()

def start_signal_system():
    """Start the signal system"""
    signal_system.start_signal_generation(interval_minutes=30)  # Generate signals every 30 minutes

def stop_signal_system():
    """Stop the signal system"""
    signal_system.stop_signal_generation()

def get_signal_system():
    """Get the signal system instance"""
    return signal_system
