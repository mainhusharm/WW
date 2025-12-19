"""
Comprehensive tests for the real-time signal pipeline
Tests signal creation, Socket.IO emission, user fetch, and authentication
"""

import pytest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the journal directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'journal'))

from journal.signal_models import Signal, UserSignal, SignalRiskMap, db
from journal.admin_signals_api import admin_signals_bp
from journal.user_signals_api import user_signals_bp
from journal.redis_service import RedisService
from journal.socketio_service import socketio_app
from journal.signal_broadcaster import SignalBroadcaster
from journal.models import User

class TestSignalModels:
    """Test signal database models"""
    
    def test_signal_creation(self, app):
        """Test creating a signal with computed risk:reward ratio"""
        with app.app_context():
            # Create test signal
            signal = Signal.create_signal(
                symbol='BTCUSD',
                side='buy',
                entry_price=46000.0,
                stop_loss=45500.0,
                take_profit=48000.0,
                risk_tier='medium',
                payload={'timeframe': '1H', 'analysis': 'Test signal'},
                created_by=str(uuid.uuid4())
            )
            
            assert signal.symbol == 'BTCUSD'
            assert signal.side == 'BUY'
            assert signal.entry_price == 46000.0
            assert signal.stop_loss == 45500.0
            assert signal.take_profit == 48000.0
            assert signal.risk_tier == 'medium'
            assert signal.origin == 'admin'
            assert signal.status == 'active'
            assert signal.immutable == True
            
            # Check computed R:R ratio
            expected_rr = (48000 - 46000) / (46000 - 45500)  # 2000 / 500 = 4.0
            assert abs(signal.rr_ratio - 4.0) < 0.001
    
    def test_signal_to_dict(self, app):
        """Test signal serialization to dictionary"""
        with app.app_context():
            signal = Signal.create_signal(
                symbol='EURUSD',
                side='sell',
                entry_price=1.0850,
                stop_loss=1.0900,
                take_profit=1.0750,
                risk_tier='high',
                payload={'timeframe': '4H'},
                created_by=str(uuid.uuid4())
            )
            
            signal_dict = signal.to_dict()
            
            assert isinstance(signal_dict, dict)
            assert signal_dict['symbol'] == 'EURUSD'
            assert signal_dict['side'] == 'SELL'
            assert signal_dict['risk_tier'] == 'high'
            assert 'id' in signal_dict
            assert 'created_at' in signal_dict
    
    def test_user_signal_mapping(self, app):
        """Test user-signal mapping creation"""
        with app.app_context():
            user_id = str(uuid.uuid4())
            signal_id = str(uuid.uuid4())
            
            # Create mapping
            user_signal = UserSignal.create_user_signal_mapping(user_id, signal_id)
            
            assert user_signal.user_id == user_id
            assert user_signal.signal_id == signal_id
            assert user_signal.delivered == False
    
    def test_mark_delivered(self, app):
        """Test marking signal as delivered"""
        with app.app_context():
            user_id = str(uuid.uuid4())
            signal_id = str(uuid.uuid4())
            
            # Create mapping
            UserSignal.create_user_signal_mapping(user_id, signal_id)
            
            # Mark as delivered
            UserSignal.mark_delivered(user_id, signal_id)
            
            # Check if marked as delivered
            user_signal = UserSignal.query.filter_by(
                user_id=user_id,
                signal_id=signal_id
            ).first()
            
            assert user_signal.delivered == True
            assert user_signal.delivered_at is not None

class TestAdminSignalsAPI:
    """Test admin signals API endpoints"""
    
    def test_create_signal_validation(self, client, admin_token):
        """Test signal creation with validation"""
        # Test missing required fields
        response = client.post('/admin/signals', 
            json={'symbol': 'BTCUSD'},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 422
        assert 'Missing required fields' in response.json['error']
        
        # Test invalid side
        response = client.post('/admin/signals',
            json={
                'symbol': 'BTCUSD',
                'side': 'invalid',
                'entry_price': 46000,
                'stop_loss': 45500,
                'take_profit': 48000,
                'risk_tier': 'medium'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 422
        assert 'Side must be' in response.json['error']
        
        # Test invalid risk tier
        response = client.post('/admin/signals',
            json={
                'symbol': 'BTCUSD',
                'side': 'buy',
                'entry_price': 46000,
                'stop_loss': 45500,
                'take_profit': 48000,
                'risk_tier': 'invalid'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 422
        assert 'Risk tier must be' in response.json['error']
    
    @patch('journal.admin_signals_api.redis_service')
    def test_create_signal_success(self, mock_redis, client, admin_token, admin_user):
        """Test successful signal creation"""
        mock_redis.publish_signal.return_value = True
        
        signal_data = {
            'symbol': 'BTCUSD',
            'side': 'buy',
            'entry_price': 46000,
            'stop_loss': 45500,
            'take_profit': 48000,
            'risk_tier': 'medium',
            'payload': {
                'timeframe': '1H',
                'analysis': 'Test signal'
            }
        }
        
        response = client.post('/admin/signals',
            json=signal_data,
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 201
        data = response.json
        
        assert data['success'] == True
        assert 'signal' in data
        assert data['signal']['symbol'] == 'BTCUSD'
        assert data['signal']['side'] == 'BUY'
        assert data['redis_published'] == True
        
        # Verify Redis publish was called
        mock_redis.publish_signal.assert_called_once()
    
    def test_get_admin_signals(self, client, admin_token):
        """Test fetching admin signals"""
        response = client.get('/admin/signals',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 200
        data = response.json
        
        assert data['success'] == True
        assert 'signals' in data
        assert 'count' in data
        assert isinstance(data['signals'], list)
    
    def test_archive_signal(self, client, admin_token, test_signal):
        """Test archiving a signal"""
        response = client.patch(f'/admin/signals/{test_signal.id}/archive',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 200
        data = response.json
        
        assert data['success'] == True
        assert data['signal']['status'] == 'archived'

class TestUserSignalsAPI:
    """Test user signals API endpoints"""
    
    def test_get_user_signals(self, client, user_token, test_user):
        """Test fetching user signals"""
        response = client.get('/user/signals',
            headers={'Authorization': f'Bearer {user_token}'}
        )
        
        assert response.status_code == 200
        data = response.json
        
        assert data['success'] == True
        assert 'signals' in data
        assert 'user_risk_tier' in data
        assert isinstance(data['signals'], list)
    
    def test_get_user_signals_with_filters(self, client, user_token):
        """Test fetching user signals with filters"""
        response = client.get('/user/signals?limit=10&include_delivered=true',
            headers={'Authorization': f'Bearer {user_token}'}
        )
        
        assert response.status_code == 200
        data = response.json
        
        assert data['success'] == True
        assert data['filters']['limit'] == 10
        assert data['filters']['include_delivered'] == True
    
    def test_get_recent_signals(self, client, user_token):
        """Test fetching recent signals"""
        response = client.get('/user/signals/recent',
            headers={'Authorization': f'Bearer {user_token}'}
        )
        
        assert response.status_code == 200
        data = response.json
        
        assert data['success'] == True
        assert data['period'] == '24_hours'
        assert 'user_risk_tier' in data
    
    def test_mark_signal_delivered(self, client, user_token, test_signal):
        """Test marking signal as delivered"""
        response = client.post(f'/user/signals/{test_signal.id}/delivered',
            headers={'Authorization': f'Bearer {user_token}'}
        )
        
        assert response.status_code == 200
        data = response.json
        
        assert data['success'] == True
        assert 'marked as delivered' in data['message']
    
    def test_get_user_signal_stats(self, client, user_token):
        """Test fetching user signal statistics"""
        response = client.get('/user/signals/stats',
            headers={'Authorization': f'Bearer {user_token}'}
        )
        
        assert response.status_code == 200
        data = response.json
        
        assert data['success'] == True
        assert 'stats' in data
        assert 'total_signals' in data['stats']
        assert 'user_risk_tier' in data['stats']

class TestRedisService:
    """Test Redis service functionality"""
    
    @patch('redis.from_url')
    def test_redis_connection(self, mock_redis_from_url):
        """Test Redis connection setup"""
        mock_client = Mock()
        mock_redis_from_url.return_value = mock_client
        mock_client.ping.return_value = True
        
        redis_service = RedisService()
        
        assert redis_service.client is not None
        mock_client.ping.assert_called_once()
    
    @patch('redis.from_url')
    def test_publish_signal(self, mock_redis_from_url):
        """Test publishing signal to Redis"""
        mock_client = Mock()
        mock_redis_from_url.return_value = mock_client
        mock_client.publish.return_value = 1
        
        redis_service = RedisService()
        
        signal_data = {
            'id': str(uuid.uuid4()),
            'risk_tier': 'medium'
        }
        
        result = redis_service.publish_signal(signal_data)
        
        assert result == True
        mock_client.publish.assert_called_once()
    
    @patch('redis.from_url')
    def test_cache_user_session(self, mock_redis_from_url):
        """Test caching user session"""
        mock_client = Mock()
        mock_redis_from_url.return_value = mock_client
        
        redis_service = RedisService()
        
        user_id = str(uuid.uuid4())
        session_data = {'user_id': user_id, 'risk_tier': 'medium'}
        
        redis_service.cache_user_session(user_id, session_data)
        
        mock_client.setex.assert_called_once()

class TestSocketIOService:
    """Test Socket.IO service functionality"""
    
    def test_socket_connection_auth(self):
        """Test Socket.IO connection with authentication"""
        # Mock JWT decode
        with patch('journal.socketio_service.decode_token') as mock_decode:
            mock_decode.return_value = {'sub': 'test_user_id'}
            
            # Mock user query
            with patch('journal.socketio_service.User') as mock_user:
                mock_user.query.get.return_value = Mock(
                    uuid='test_user_id',
                    username='test_user',
                    risk_tier='medium'
                )
                
                # Test connection
                result = socketio_app._handle_connect(
                    sid='test_sid',
                    environ={},
                    auth={'token': 'valid_token'}
                )
                
                assert result == True
    
    def test_socket_connection_no_token(self):
        """Test Socket.IO connection without token"""
        result = socketio_app._handle_connect(
            sid='test_sid',
            environ={},
            auth={}
        )
        
        assert result == False
    
    def test_broadcast_signal_to_risk_tier(self):
        """Test broadcasting signal to risk tier room"""
        with patch('journal.socketio_service.sio') as mock_sio:
            signal_data = {
                'id': str(uuid.uuid4()),
                'risk_tier': 'medium',
                'symbol': 'BTCUSD'
            }
            
            from journal.socketio_service import broadcast_signal_to_risk_tier
            broadcast_signal_to_risk_tier(signal_data)
            
            mock_sio.emit.assert_called_once_with(
                'signal:new', 
                signal_data, 
                room='risk:medium'
            )

class TestSignalBroadcaster:
    """Test signal broadcaster functionality"""
    
    def test_signal_broadcaster_initialization(self):
        """Test signal broadcaster initialization"""
        broadcaster = SignalBroadcaster()
        
        assert broadcaster.running == False
        assert broadcaster.subscriber_thread is None
    
    @patch('journal.signal_broadcaster.redis_service')
    def test_start_broadcaster(self, mock_redis):
        """Test starting signal broadcaster"""
        mock_redis.subscribe_to_signals.return_value = None
        
        broadcaster = SignalBroadcaster()
        broadcaster.start()
        
        assert broadcaster.running == True
        assert broadcaster.subscriber_thread is not None
    
    def test_stop_broadcaster(self):
        """Test stopping signal broadcaster"""
        broadcaster = SignalBroadcaster()
        broadcaster.running = True
        
        broadcaster.stop()
        
        assert broadcaster.running == False

class TestIntegration:
    """Integration tests for the complete signal pipeline"""
    
    @patch('journal.admin_signals_api.redis_service')
    @patch('journal.signal_broadcaster.broadcast_signal_to_risk_tier')
    def test_complete_signal_pipeline(self, mock_broadcast, mock_redis, client, admin_token, admin_user):
        """Test complete signal creation to delivery pipeline"""
        mock_redis.publish_signal.return_value = True
        
        # 1. Admin creates signal
        signal_data = {
            'symbol': 'BTCUSD',
            'side': 'buy',
            'entry_price': 46000,
            'stop_loss': 45500,
            'take_profit': 48000,
            'risk_tier': 'medium',
            'payload': {'analysis': 'Integration test signal'}
        }
        
        response = client.post('/admin/signals',
            json=signal_data,
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 201
        signal_id = response.json['signal']['id']
        
        # 2. Verify signal was published to Redis
        mock_redis.publish_signal.assert_called_once()
        
        # 3. Simulate Redis message handling
        message_data = {
            'signal_id': signal_id,
            'risk_tier': 'medium'
        }
        
        # This would normally be handled by the Redis subscriber
        # For testing, we'll call the handler directly
        from journal.signal_broadcaster import signal_broadcaster
        signal_broadcaster._handle_signal_message(message_data)
        
        # 4. Verify signal was broadcast to Socket.IO
        # (This would be verified in a real integration test with Socket.IO client)
        
        # 5. User fetches signals
        user_response = client.get('/user/signals',
            headers={'Authorization': f'Bearer {admin_token}'}  # Using admin token as user for test
        )
        
        assert user_response.status_code == 200
        user_signals = user_response.json['signals']
        
        # Verify signal is in user's signal list
        signal_found = any(s['id'] == signal_id for s in user_signals)
        assert signal_found == True

# Fixtures for testing
@pytest.fixture
def app():
    """Create test Flask app"""
    from journal import create_app
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def admin_token():
    """Create admin JWT token for testing"""
    from flask_jwt_extended import create_access_token
    return create_access_token(identity='admin_user_id', additional_claims={'role': 'admin'})

@pytest.fixture
def user_token():
    """Create user JWT token for testing"""
    from flask_jwt_extended import create_access_token
    return create_access_token(identity='user_id', additional_claims={'role': 'user'})

@pytest.fixture
def admin_user(app):
    """Create test admin user"""
    with app.app_context():
        user = User(
            uuid=str(uuid.uuid4()),
            username='admin',
            email='admin@test.com',
            password_hash='hashed_password',
            plan_type='enterprise'
        )
        db.session.add(user)
        db.session.commit()
        return user

@pytest.fixture
def test_user(app):
    """Create test user"""
    with app.app_context():
        user = User(
            uuid=str(uuid.uuid4()),
            username='testuser',
            email='user@test.com',
            password_hash='hashed_password',
            plan_type='pro',
            risk_tier='medium'
        )
        db.session.add(user)
        db.session.commit()
        return user

@pytest.fixture
def test_signal(app, admin_user):
    """Create test signal"""
    with app.app_context():
        signal = Signal.create_signal(
            symbol='TESTUSD',
            side='buy',
            entry_price=100.0,
            stop_loss=95.0,
            take_profit=110.0,
            risk_tier='medium',
            payload={'test': True},
            created_by=str(admin_user.uuid)
        )
        db.session.add(signal)
        db.session.commit()
        return signal

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
