#!/usr/bin/env python3
"""
Real-time Signal API Endpoints
Provides REST API for real-time signal system
"""

from flask import Blueprint, jsonify, request
from flask_socketio import emit
from real_time_signal_system import signal_system, get_real_time_signals, get_real_time_stats
import json

# Create blueprint for real-time signals
real_time_signals_bp = Blueprint('real_time_signals', __name__, url_prefix='/api')

@real_time_signals_bp.route('/real-time-signals', methods=['GET'])
def get_signals():
    """Get real-time signals for user dashboard"""
    try:
        market = request.args.get('market', 'all')
        limit = int(request.args.get('limit', 50))
        
        signals = get_real_time_signals(market, limit)
        
        return jsonify({
            'success': True,
            'signals': signals,
            'count': len(signals),
            'market': market
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@real_time_signals_bp.route('/real-time-signals/stats', methods=['GET'])
def get_signal_stats():
    """Get real-time signal statistics"""
    try:
        stats = get_real_time_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@real_time_signals_bp.route('/real-time-signals/start', methods=['POST'])
def start_signal_generation():
    """Start real-time signal generation"""
    try:
        interval = request.json.get('interval_minutes', 3) if request.json else 3
        signal_system.start_signal_generation(interval)
        
        return jsonify({
            'success': True,
            'message': f'Real-time signal generation started with {interval} minute intervals'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@real_time_signals_bp.route('/real-time-signals/stop', methods=['POST'])
def stop_signal_generation():
    """Stop real-time signal generation"""
    try:
        signal_system.stop_signal_generation()
        
        return jsonify({
            'success': True,
            'message': 'Real-time signal generation stopped'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@real_time_signals_bp.route('/real-time-signals/generate-crypto', methods=['POST'])
def generate_crypto_signal():
    """Generate a single crypto signal from admin dashboard"""
    try:
        data = request.get_json() or {}
        
        # Generate crypto signal
        crypto_signal = signal_system.generator.generate_crypto_signal()
        
        # Override with admin data if provided
        if data:
            crypto_signal.update({
                'symbol': data.get('symbol', crypto_signal['symbol']),
                'side': data.get('side', crypto_signal['side']),
                'entry_price': float(data.get('entry_price', crypto_signal['entry_price'])),
                'stop_loss': float(data.get('stop_loss', crypto_signal['stop_loss'])),
                'take_profit': float(data.get('take_profit', crypto_signal['take_profit'])),
                'confidence': int(data.get('confidence', crypto_signal['confidence'])),
                'analysis': data.get('analysis', crypto_signal['analysis']),
                'ict_concepts': data.get('ict_concepts', crypto_signal['ict_concepts']),
                'timeframe': data.get('timeframe', crypto_signal['timeframe'])
            })
        
        # Store in database
        signal_id = signal_system.db.create_signal(crypto_signal)
        
        # Prepare signal for WebSocket broadcast
        signal_payload = {
            'id': signal_id,
            'pair': crypto_signal['symbol'],
            'direction': crypto_signal['side'],
            'entry': str(crypto_signal['entry_price']),
            'entryPrice': str(crypto_signal['entry_price']),
            'stopLoss': str(crypto_signal['stop_loss']),
            'takeProfit': str(crypto_signal['take_profit']),
            'confidence': crypto_signal['confidence'],
            'analysis': crypto_signal['analysis'],
            'ictConcepts': crypto_signal['ict_concepts'],
            'market': 'crypto',
            'timeframe': crypto_signal['timeframe'],
            'timestamp': signal_id,  # Using signal_id as timestamp for now
            'status': 'active',
            'is_recommended': crypto_signal['confidence'] > 80
        }
        
        return jsonify({
            'success': True,
            'message': 'Crypto signal generated successfully',
            'signal': signal_payload,
            'signal_id': signal_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@real_time_signals_bp.route('/real-time-signals/generate-forex', methods=['POST'])
def generate_forex_signal():
    """Generate a single forex signal from admin dashboard"""
    try:
        data = request.get_json() or {}
        
        # Generate forex signal
        forex_signal = signal_system.generator.generate_forex_signal()
        
        # Override with admin data if provided
        if data:
            forex_signal.update({
                'symbol': data.get('symbol', forex_signal['symbol']),
                'side': data.get('side', forex_signal['side']),
                'entry_price': float(data.get('entry_price', forex_signal['entry_price'])),
                'stop_loss': float(data.get('stop_loss', forex_signal['stop_loss'])),
                'take_profit': float(data.get('take_profit', forex_signal['take_profit'])),
                'confidence': int(data.get('confidence', forex_signal['confidence'])),
                'analysis': data.get('analysis', forex_signal['analysis']),
                'ict_concepts': data.get('ict_concepts', forex_signal['ict_concepts']),
                'timeframe': data.get('timeframe', forex_signal['timeframe'])
            })
        
        # Store in database
        signal_id = signal_system.db.create_signal(forex_signal)
        
        # Prepare signal for WebSocket broadcast
        signal_payload = {
            'id': signal_id,
            'pair': forex_signal['symbol'],
            'direction': forex_signal['side'],
            'entry': str(forex_signal['entry_price']),
            'entryPrice': str(forex_signal['entry_price']),
            'stopLoss': str(forex_signal['stop_loss']),
            'takeProfit': str(forex_signal['take_profit']),
            'confidence': forex_signal['confidence'],
            'analysis': forex_signal['analysis'],
            'ictConcepts': forex_signal['ict_concepts'],
            'market': 'forex',
            'timeframe': forex_signal['timeframe'],
            'timestamp': signal_id,  # Using signal_id as timestamp for now
            'status': 'active',
            'is_recommended': forex_signal['confidence'] > 80
        }
        
        return jsonify({
            'success': True,
            'message': 'Forex signal generated successfully',
            'signal': signal_payload,
            'signal_id': signal_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@real_time_signals_bp.route('/real-time-signals/clear-all', methods=['POST'])
def clear_all_signals():
    """Clear all signals (for testing purposes)"""
    try:
        conn = signal_system.db.db_path
        import sqlite3
        
        with sqlite3.connect(conn) as db_conn:
            cursor = db_conn.cursor()
            cursor.execute('DELETE FROM signals')
            cursor.execute('DELETE FROM signal_feed')
            cursor.execute('DELETE FROM user_signal_history')
            db_conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'All signals cleared successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# WebSocket event handlers
def register_websocket_handlers(socketio):
    """Register WebSocket event handlers for real-time signals"""
    
    @socketio.on('connect')
    def handle_connect():
        print('Client connected to real-time signals')
    
    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected from real-time signals')
    
    @socketio.on('request_signals')
    def handle_request_signals(data):
        """Handle client request for signals"""
        try:
            market = data.get('market', 'all')
            limit = data.get('limit', 50)
            
            signals = get_real_time_signals(market, limit)
            
            emit('signals_data', {
                'signals': signals,
                'count': len(signals),
                'market': market
            })
            
        except Exception as e:
            emit('error', {'message': str(e)})
    
    @socketio.on('request_stats')
    def handle_request_stats():
        """Handle client request for signal statistics"""
        try:
            stats = get_real_time_stats()
            emit('stats_data', stats)
        except Exception as e:
            emit('error', {'message': str(e)})
