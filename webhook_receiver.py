#!/usr/bin/env python3
"""
Webhook Receiver for Testing Real-time Signal Delivery
This simulates the frontend receiving webhook notifications
"""

from flask import Flask, request, jsonify
import json
from datetime import datetime

app = Flask(__name__)

# Store received signals
received_signals = []

@app.route('/webhook/signal', methods=['POST'])
def receive_signal_webhook():
    """Receive signal webhook from backend"""
    try:
        data = request.get_json()
        
        if data and data.get('event') == 'new_signal':
            signal = data.get('data', {})
            received_signals.append({
                'signal': signal,
                'received_at': datetime.now().isoformat(),
                'webhook_timestamp': data.get('timestamp')
            })
            
            print(f"🔔 Received signal webhook: {signal.get('pair')} {signal.get('direction')}")
            print(f"   Entry: {signal.get('entry_price')}")
            print(f"   Stop Loss: {signal.get('stop_loss')}")
            print(f"   Take Profit: {signal.get('take_profit')}")
            print(f"   Confidence: {signal.get('confidence')}%")
            print(f"   Analysis: {signal.get('analysis')}")
            print(f"   ICT Concepts: {signal.get('ict_concepts')}")
            print(f"   Source: {signal.get('source')}")
            print("-" * 50)
            
            return jsonify({
                'success': True,
                'message': 'Signal received successfully',
                'signal_id': signal.get('id')
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid webhook data'
            }), 400
            
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/webhook/signals', methods=['GET'])
def get_received_signals():
    """Get all received signals"""
    return jsonify({
        'signals': received_signals,
        'total_count': len(received_signals),
        'last_updated': datetime.now().isoformat()
    })

@app.route('/webhook/clear', methods=['POST'])
def clear_signals():
    """Clear all received signals"""
    global received_signals
    received_signals = []
    return jsonify({
        'success': True,
        'message': 'All signals cleared'
    })

@app.route('/webhook/health', methods=['GET'])
def health_check():
    """Health check for webhook receiver"""
    return jsonify({
        'status': 'healthy',
        'message': 'Webhook receiver is running',
        'received_signals': len(received_signals),
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🔔 Starting Webhook Receiver on port 8081")
    print("✅ Ready to receive real-time signals")
    print("✅ Webhook endpoint: http://localhost:8081/webhook/signal")
    print("✅ View signals: http://localhost:8081/webhook/signals")
    print("✅ Health check: http://localhost:8081/webhook/health")
    
    app.run(host='0.0.0.0', port=8081, debug=True)
