"""
Redis Service for Real-time Signal Distribution
Handles Redis Pub/Sub for signal broadcasting and caching
"""

import redis
import json
import os
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime

logger = logging.getLogger(__name__)

class RedisService:
    """Redis service for pub/sub and caching operations"""
    
    def __init__(self):
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.client = None
        self.subscriber = None
        self.pubsub = None
        self._connect()
    
    def _connect(self):
        """Establish Redis connection"""
        try:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
            self.subscriber = redis.from_url(self.redis_url, decode_responses=True)
            self.pubsub = self.subscriber.pubsub()
            
            # Test connection
            self.client.ping()
            logger.info("Redis connection established successfully")
            self.connected = True
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            logger.warning("Redis service will run in fallback mode")
            self.connected = False
            # Don't raise exception, allow app to start without Redis
    
    def publish_signal(self, signal_data: Dict[str, Any]) -> bool:
        """
        Publish a new signal to Redis channel
        
        Args:
            signal_data: Signal data to publish
            
        Returns:
            bool: True if published successfully
        """
        if not self.connected:
            logger.warning("Redis not connected, signal not published")
            return False
            
        try:
            channel = 'signals:new'
            payload = {
                'signal_id': signal_data.get('id'),
                'risk_tier': signal_data.get('risk_tier'),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            result = self.client.publish(channel, json.dumps(payload))
            logger.info(f"Published signal {signal_data.get('id')} to {channel}, {result} subscribers")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish signal: {e}")
            return False
    
    def subscribe_to_signals(self, callback: Callable[[Dict[str, Any]], None]):
        """
        Subscribe to new signals and call callback when received
        
        Args:
            callback: Function to call when signal is received
        """
        if not self.connected:
            logger.warning("Redis not connected, subscription not available")
            return
            
        try:
            self.pubsub.subscribe('signals:new')
            logger.info("Subscribed to signals:new channel")
            
            for message in self.pubsub.listen():
                if message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        callback(data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode message: {e}")
                        
        except Exception as e:
            logger.error(f"Failed to subscribe to signals: {e}")
            raise
    
    def cache_user_session(self, user_id: str, session_data: Dict[str, Any], ttl: int = 3600):
        """
        Cache user session data
        
        Args:
            user_id: User identifier
            session_data: Session data to cache
            ttl: Time to live in seconds
        """
        if not self.connected:
            logger.warning("Redis not connected, session not cached")
            return
            
        try:
            key = f"user_session:{user_id}"
            self.client.setex(key, ttl, json.dumps(session_data))
        except Exception as e:
            logger.error(f"Failed to cache user session: {e}")
    
    def get_user_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached user session data
        
        Args:
            user_id: User identifier
            
        Returns:
            Dict with session data or None if not found
        """
        if not self.connected:
            logger.warning("Redis not connected, session not retrieved")
            return None
            
        try:
            key = f"user_session:{user_id}"
            data = self.client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get user session: {e}")
            return None
    
    def cache_signal_delivery(self, user_id: str, signal_id: str, delivered: bool = True):
        """
        Cache signal delivery status for user
        
        Args:
            user_id: User identifier
            signal_id: Signal identifier
            delivered: Whether signal was delivered
        """
        try:
            key = f"signal_delivery:{user_id}:{signal_id}"
            data = {
                'delivered': delivered,
                'timestamp': datetime.utcnow().isoformat()
            }
            # Cache for 24 hours
            self.client.setex(key, 86400, json.dumps(data))
        except Exception as e:
            logger.error(f"Failed to cache signal delivery: {e}")
    
    def get_signal_delivery_status(self, user_id: str, signal_id: str) -> Optional[Dict[str, Any]]:
        """
        Get signal delivery status for user
        
        Args:
            user_id: User identifier
            signal_id: Signal identifier
            
        Returns:
            Dict with delivery status or None if not found
        """
        try:
            key = f"signal_delivery:{user_id}:{signal_id}"
            data = self.client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get signal delivery status: {e}")
            return None
    
    def increment_signal_counter(self, signal_id: str) -> int:
        """
        Increment delivery counter for signal
        
        Args:
            signal_id: Signal identifier
            
        Returns:
            Current count
        """
        try:
            key = f"signal_counter:{signal_id}"
            return self.client.incr(key)
        except Exception as e:
            logger.error(f"Failed to increment signal counter: {e}")
            return 0
    
    def get_signal_counter(self, signal_id: str) -> int:
        """
        Get delivery counter for signal
        
        Args:
            signal_id: Signal identifier
            
        Returns:
            Current count
        """
        try:
            key = f"signal_counter:{signal_id}"
            count = self.client.get(key)
            return int(count) if count else 0
        except Exception as e:
            logger.error(f"Failed to get signal counter: {e}")
            return 0
    
    def close(self):
        """Close Redis connections"""
        try:
            if self.pubsub:
                self.pubsub.close()
            if self.subscriber:
                self.subscriber.close()
            if self.client:
                self.client.close()
            logger.info("Redis connections closed")
        except Exception as e:
            logger.error(f"Error closing Redis connections: {e}")

# Global Redis service instance
redis_service = RedisService()
