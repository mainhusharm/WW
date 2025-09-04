"""
Socket.IO Service for Real-time Signal Distribution
Handles WebSocket connections, authentication, and room management
"""

import socketio
import logging
from typing import Dict, Any, Optional
from flask_jwt_extended import decode_token
from datetime import datetime

from .models import User
from .signal_models import Signal, UserSignal, db
from .redis_service import redis_service

logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.Server(
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Store connected users for tracking
connected_users: Dict[str, Dict[str, Any]] = {}

@sio.event
def connect(sid, environ, auth):
    """
    Handle client connection with JWT authentication
    """
    try:
        # Get token from auth or query params
        token = None
        if auth and 'token' in auth:
            token = auth['token']
        elif 'QUERY_STRING' in environ:
            # Parse query string for token
            query_params = environ['QUERY_STRING']
            if 'token=' in query_params:
                token = query_params.split('token=')[1].split('&')[0]
        
        if not token:
            logger.warning(f"Connection rejected - no token provided for sid {sid}")
            return False
        
        # Verify JWT token
        try:
            decoded_token = decode_token(token)
            user_id = decoded_token.get('sub')
            
            if not user_id:
                logger.warning(f"Connection rejected - invalid token for sid {sid}")
                return False
            
            # Get user from database
            user = User.query.get(user_id)
            if not user:
                logger.warning(f"Connection rejected - user not found for sid {sid}")
                return False
            
            # Get user's risk tier
            user_risk_tier = getattr(user, 'risk_tier', 'medium')
            if not user_risk_tier:
                user_risk_tier = 'medium'
            
            # Store user info
            connected_users[sid] = {
                'user_id': str(user.uuid),
                'username': user.username,
                'risk_tier': user_risk_tier,
                'connected_at': datetime.utcnow(),
                'session_id': decoded_token.get('session_id')
            }
            
            # Join user-specific room
            user_room = f"user:{user.uuid}"
            sio.enter_room(sid, user_room)
            
            # Join risk-tier room
            risk_room = f"risk:{user_risk_tier}"
            sio.enter_room(sid, risk_room)
            
            logger.info(f"User {user.username} ({user.uuid}) connected with sid {sid}, joined rooms: {user_room}, {risk_room}")
            
            # Send welcome message with missed signals
            sio.emit('connected', {
                'message': 'Connected successfully',
                'user_id': str(user.uuid),
                'risk_tier': user_risk_tier,
                'rooms': [user_room, risk_room]
            }, room=sid)
            
            return True
            
        except Exception as e:
            logger.error(f"Token verification failed for sid {sid}: {e}")
            return False
            
    except Exception as e:
        logger.error(f"Connection error for sid {sid}: {e}")
        return False

@sio.event
def disconnect(sid):
    """
    Handle client disconnection
    """
    try:
        if sid in connected_users:
            user_info = connected_users[sid]
            logger.info(f"User {user_info['username']} ({user_info['user_id']}) disconnected")
            del connected_users[sid]
        else:
            logger.info(f"Unknown user disconnected with sid {sid}")
    except Exception as e:
        logger.error(f"Disconnect error for sid {sid}: {e}")

@sio.event
def join_room(sid, data):
    """
    Allow clients to join additional rooms
    """
    try:
        if sid not in connected_users:
            sio.emit('error', {'message': 'Not authenticated'}, room=sid)
            return
        
        room = data.get('room')
        if room:
            sio.enter_room(sid, room)
            sio.emit('joined_room', {'room': room}, room=sid)
            logger.info(f"User {connected_users[sid]['username']} joined room {room}")
        
    except Exception as e:
        logger.error(f"Join room error for sid {sid}: {e}")
        sio.emit('error', {'message': 'Failed to join room'}, room=sid)

@sio.event
def leave_room(sid, data):
    """
    Allow clients to leave rooms
    """
    try:
        if sid not in connected_users:
            sio.emit('error', {'message': 'Not authenticated'}, room=sid)
            return
        
        room = data.get('room')
        if room and not room.startswith('user:') and not room.startswith('risk:'):
            # Don't allow leaving user or risk rooms
            sio.leave_room(sid, room)
            sio.emit('left_room', {'room': room}, room=sid)
            logger.info(f"User {connected_users[sid]['username']} left room {room}")
        
    except Exception as e:
        logger.error(f"Leave room error for sid {sid}: {e}")
        sio.emit('error', {'message': 'Failed to leave room'}, room=sid)

@sio.event
def ping(sid, data):
    """
    Handle ping from client
    """
    try:
        if sid in connected_users:
            sio.emit('pong', {'timestamp': datetime.utcnow().isoformat()}, room=sid)
    except Exception as e:
        logger.error(f"Ping error for sid {sid}: {e}")

def broadcast_signal_to_risk_tier(signal_data: Dict[str, Any]):
    """
    Broadcast signal to all users in a specific risk tier
    
    Args:
        signal_data: Signal data to broadcast
    """
    try:
        risk_tier = signal_data.get('risk_tier')
        if not risk_tier:
            logger.error("No risk_tier in signal data")
            return
        
        risk_room = f"risk:{risk_tier}"
        
        # Emit to risk tier room
        sio.emit('signal:new', signal_data, room=risk_room)
        
        # Count connected users in this risk tier
        connected_count = sum(1 for user_info in connected_users.values() 
                            if user_info['risk_tier'] == risk_tier)
        
        logger.info(f"Broadcasted signal {signal_data.get('id')} to risk tier {risk_tier} ({connected_count} connected users)")
        
        # Update delivery tracking in database
        update_signal_delivery_tracking(signal_data)
        
    except Exception as e:
        logger.error(f"Error broadcasting signal to risk tier: {e}")

def send_signal_to_user(user_id: str, signal_data: Dict[str, Any]):
    """
    Send signal to a specific user
    
    Args:
        user_id: User ID
        signal_data: Signal data to send
    """
    try:
        user_room = f"user:{user_id}"
        sio.emit('signal:new', signal_data, room=user_room)
        
        logger.info(f"Sent signal {signal_data.get('id')} to user {user_id}")
        
    except Exception as e:
        logger.error(f"Error sending signal to user {user_id}: {e}")

def update_signal_delivery_tracking(signal_data: Dict[str, Any]):
    """
    Update delivery tracking for all users who should receive this signal
    
    Args:
        signal_data: Signal data
    """
    try:
        signal_id = signal_data.get('id')
        risk_tier = signal_data.get('risk_tier')
        
        if not signal_id or not risk_tier:
            return
        
        # Get all users with this risk tier
        users = User.query.filter_by(risk_tier=risk_tier).all()
        
        for user in users:
            # Create or update user-signal mapping
            user_signal = UserSignal.query.filter_by(
                user_id=str(user.uuid),
                signal_id=signal_id
            ).first()
            
            if not user_signal:
                UserSignal.create_user_signal_mapping(str(user.uuid), signal_id)
            
            # Mark as delivered if user is currently connected
            if any(user_info['user_id'] == str(user.uuid) for user_info in connected_users.values()):
                UserSignal.mark_delivered(str(user.uuid), signal_id)
        
        logger.info(f"Updated delivery tracking for signal {signal_id} to {len(users)} users")
        
    except Exception as e:
        logger.error(f"Error updating delivery tracking: {e}")

def get_connected_users_stats() -> Dict[str, Any]:
    """
    Get statistics about connected users
    
    Returns:
        Dictionary with connection statistics
    """
    try:
        total_connected = len(connected_users)
        risk_tier_counts = {}
        
        for user_info in connected_users.values():
            risk_tier = user_info['risk_tier']
            risk_tier_counts[risk_tier] = risk_tier_counts.get(risk_tier, 0) + 1
        
        return {
            'total_connected': total_connected,
            'by_risk_tier': risk_tier_counts,
            'connected_users': [
                {
                    'user_id': user_info['user_id'],
                    'username': user_info['username'],
                    'risk_tier': user_info['risk_tier'],
                    'connected_at': user_info['connected_at'].isoformat()
                }
                for user_info in connected_users.values()
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting connected users stats: {e}")
        return {'total_connected': 0, 'by_risk_tier': {}, 'connected_users': []}

def broadcast_system_message(message: str, room: Optional[str] = None):
    """
    Broadcast system message to all users or specific room
    
    Args:
        message: Message to broadcast
        room: Specific room to broadcast to (None for all users)
    """
    try:
        system_message = {
            'type': 'system',
            'message': message,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if room:
            sio.emit('system:message', system_message, room=room)
            logger.info(f"Broadcasted system message to room {room}: {message}")
        else:
            sio.emit('system:message', system_message)
            logger.info(f"Broadcasted system message to all users: {message}")
        
    except Exception as e:
        logger.error(f"Error broadcasting system message: {e}")

# Export the Socket.IO server instance
socketio_app = sio
