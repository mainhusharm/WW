#!/usr/bin/env python3
"""
Production startup script with optimizations
"""

import os
import sys
import logging
from app import app, socketio

# Configure production logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('production.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def start_production_server():
    """Start production server with optimizations"""
    try:
        # Get port from environment
        port = int(os.environ.get('PORT', 5000))
        host = os.environ.get('HOST', '0.0.0.0')
        
        logger.info(f"Starting production server on {host}:{port}")
        logger.info("Production optimizations enabled:")
        logger.info("- Connection pooling active")
        logger.info("- Rate limiting active")
        logger.info("- Caching system active")
        logger.info("- Error handling enhanced")
        logger.info("- WebSocket optimizations enabled")
        
        # Start server with production settings
        socketio.run(
            app,
            host=host,
            port=port,
            debug=False,
            use_reloader=False,
            log_output=True,
            allow_unsafe_werkzeug=True
        )
        
    except Exception as e:
        logger.error(f"Failed to start production server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    start_production_server()
