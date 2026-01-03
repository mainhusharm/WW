#!/usr/bin/env python3
"""
WSGI Configuration for Socket.IO Support
This file configures the Flask app with Socket.IO for production deployment
"""

from journal import create_app, socketio

# Create the Flask app
app = create_app()

# Export the Socket.IO WSGI app for gunicorn
application = socketio.WSGIApp(socketio, app)

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
