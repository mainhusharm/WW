"""
Signal Broadcaster - Redis Subscriber to Socket.IO Forwarder
Handles Redis pub/sub messages and forwards signals to Socket.IO rooms
"""

import threading
import logging
from typing import Dict, Any
from datetime import datetime

from .redis_service import redis_service
from .socketio_service import broadcast_signal_to_risk_tier, get_connected_users_stats
from .signal_models import Signal, db

logger = logging.getLogger(__name__)

class SignalBroadcaster:
    """Handles Redis subscription and signal broadcasting to Socket.IO"""
    
    def __init__(self):
        self.running = False
        self.subscriber_thread = None
        self.socketio_app = None
    
    def set_socketio_app(self, socketio_app):
        """Set the Socket.IO app instance"""
        self.socketio_app = socketio_app
    
    def start(self):
        """Start the Redis subscriber thread"""
        if self.running:
            logger.warning("Signal broadcaster is already running")
            return
        
        self.running = True
        self.subscriber_thread = threading.Thread(target=self._run_subscriber, daemon=True)
        self.subscriber_thread.start()
        logger.info("Signal broadcaster started")
    
    def stop(self):
        """Stop the Redis subscriber thread"""
        if not self.running:
            return
        
        self.running = False
        if self.subscriber_thread:
            self.subscriber_thread.join(timeout=5)
        logger.info("Signal broadcaster stopped")
    
    def _run_subscriber(self):
        """Run the Redis subscriber in a separate thread"""
        try:
            redis_service.subscribe_to_signals(self._handle_signal_message)
        except Exception as e:
            logger.error(f"Redis subscriber error: {e}")
            self.running = False
    
    def _handle_signal_message(self, message_data: Dict[str, Any]):
        """
        Handle incoming signal message from Redis
        
        Args:
            message_data: Message data from Redis pub/sub
        """
        try:
            signal_id = message_data.get('signal_id')
            risk_tier = message_data.get('risk_tier')
            
            if not signal_id or not risk_tier:
                logger.error(f"Invalid signal message: {message_data}")
                return
            
            logger.info(f"Received signal message: {signal_id} for risk tier {risk_tier}")
            
            # Fetch complete signal data from database
            signal = Signal.query.get(signal_id)
            if not signal:
                logger.error(f"Signal {signal_id} not found in database")
                return
            
            if signal.status != 'active':
                logger.warning(f"Signal {signal_id} is not active (status: {signal.status})")
                return
            
            # Convert signal to dict for broadcasting
            signal_data = signal.to_dict()
            
            # Broadcast to Socket.IO rooms
            if self.socketio_app:
                self._broadcast_to_socketio(signal_data)
            else:
                logger.warning("Socket.IO app not set, cannot broadcast signal")
            
            # Log delivery statistics
            stats = get_connected_users_stats()
            connected_count = stats['by_risk_tier'].get(risk_tier, 0)
            logger.info(f"Broadcasted signal {signal_id} to {connected_count} connected users in risk tier {risk_tier}")
            
        except Exception as e:
            logger.error(f"Error handling signal message: {e}")
    
    def _broadcast_to_socketio(self, signal_data: Dict[str, Any]):
        """
        Broadcast signal to Socket.IO rooms
        
        Args:
            signal_data: Complete signal data
        """
        try:
            risk_tier = signal_data.get('risk_tier')
            if not risk_tier:
                logger.error("No risk_tier in signal data")
                return
            
            # Import here to avoid circular imports
            from .socketio_service import broadcast_signal_to_risk_tier
            
            # Broadcast to risk tier room
            broadcast_signal_to_risk_tier(signal_data)
            
            # Also broadcast to individual user rooms if needed
            # (This could be optimized based on your specific requirements)
            
        except Exception as e:
            logger.error(f"Error broadcasting to Socket.IO: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get broadcaster statistics
        
        Returns:
            Dictionary with broadcaster stats
        """
        try:
            stats = get_connected_users_stats()
            return {
                'running': self.running,
                'connected_users': stats,
                'redis_connected': redis_service.client.ping() if redis_service.client else False
            }
        except Exception as e:
            logger.error(f"Error getting broadcaster stats: {e}")
            return {
                'running': self.running,
                'connected_users': {'total_connected': 0, 'by_risk_tier': {}},
                'redis_connected': False
            }

# Global signal broadcaster instance
signal_broadcaster = SignalBroadcaster()

def start_signal_broadcaster(socketio_app):
    """
    Start the signal broadcaster with Socket.IO app
    
    Args:
        socketio_app: Socket.IO app instance
    """
    signal_broadcaster.set_socketio_app(socketio_app)
    signal_broadcaster.start()

def stop_signal_broadcaster():
    """Stop the signal broadcaster"""
    signal_broadcaster.stop()

def get_broadcaster_stats() -> Dict[str, Any]:
    """Get signal broadcaster statistics"""
    return signal_broadcaster.get_stats()
