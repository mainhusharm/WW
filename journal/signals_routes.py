from flask import Blueprint, request, jsonify
from .models import Signal
from .extensions import db, socketio
from datetime import datetime
import uuid
import json

signals_bp = Blueprint('signals', __name__)

@signals_bp.route('/signals', methods=['POST', 'OPTIONS'])
def create_signal():
    """Create a new trading signal from admin dashboard"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 422
        
        # Validate required fields
        required_fields = ['currencyPair', 'timeframe', 'direction', 'entryPrice', 'stopLoss', 'takeProfit']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {missing_fields}'}), 422
        
        # Generate unique signal ID
        signal_id = f"signal-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}"
        
        # Process ICT concepts
        ict_concepts_str = ','.join(data.get('ictConcepts', [])) if data.get('ictConcepts') else ''
        
        # Create new signal
        new_signal = Signal(
            signal_id=signal_id,
            pair=data['currencyPair'],
            timeframe=data['timeframe'],
            direction=data['direction'].upper(),
            entry_price=str(data['entryPrice']),
            stop_loss=str(data['stopLoss']),
            take_profit=str(data['takeProfit']),
            confidence=int(data.get('confidence', 90)),
            analysis=data.get('analysis', ''),
            ict_concepts=ict_concepts_str,
            timestamp=datetime.utcnow(),
            status='active',
            created_by='admin'
        )
        
        # Save to database
        db.session.add(new_signal)
        db.session.commit()
        
        # Check if the total number of signals exceeds 100
        total_signals = Signal.query.count()
        if total_signals > 100:
            # Find and delete the oldest signal
            oldest_signal = Signal.query.order_by(Signal.timestamp.asc()).first()
            if oldest_signal:
                db.session.delete(oldest_signal)
                db.session.commit()

        # Convert to frontend format
        signal_dict = new_signal.to_dict()
        
        # Also relay to user feed directly
        try:
            # Generate unique key for deduplication
            unique_key = f"{signal_dict['pair']}_{signal_dict['timeframe']}_{signal_dict['type']}_{datetime.utcnow().timestamp()}"
            
            # Check if signal already exists
            from .models import SignalFeed
            existing_signal = SignalFeed.query.filter_by(unique_key=unique_key).first()
            
            if not existing_signal:
                # Always try to create the signal feed entry
                # The database constraints will prevent duplicates
                new_signal_feed = SignalFeed(
                    unique_key=unique_key,
                    signal_id=signal_dict['id'],
                    pair=signal_dict['pair'],
                    direction=signal_dict['type'].upper(),  # Convert to uppercase for consistency
                    entry_price=str(signal_dict['entry']),
                    stop_loss=str(signal_dict['stopLoss']),
                    take_profit=json.dumps(signal_dict['takeProfit']) if isinstance(signal_dict['takeProfit'], list) else str(signal_dict['takeProfit']),
                    confidence=signal_dict['confidence'],
                    analysis=signal_dict['analysis'],
                    ict_concepts=json.dumps(signal_dict['ictConcepts']) if isinstance(signal_dict['ictConcepts'], list) else str(signal_dict['ictConcepts']),
                    timestamp=datetime.utcnow(),
                    status='active',
                    market='forex',  # Default to forex, can be enhanced
                    timeframe=signal_dict['timeframe'],
                    created_by='admin',
                    is_recommended=signal_dict['confidence'] > 85
                )
                
                try:
                    db.session.add(new_signal_feed)
                    db.session.commit()
                    print(f"Signal successfully relayed to user feed")
                except Exception as db_error:
                    # If it's a duplicate key error, that's fine
                    if "UNIQUE constraint failed" in str(db_error):
                        print(f"Signal already exists in user feed (duplicate prevented)")
                    else:
                        print(f"Database error when relaying signal: {str(db_error)}")
                    db.session.rollback()
                
        except Exception as relay_error:
            print(f"Warning: Failed to relay signal to user feed: {str(relay_error)}")
            db.session.rollback()
        
        # Emit signal to all connected users via WebSocket
        socketio.emit('new_signal', signal_dict)  # Send as single signal object
        
        print(f"Signal created and broadcasted: {signal_dict}")
        
        return jsonify({
            'message': 'Signal created and sent successfully',
            'signal': signal_dict
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating signal: {str(e)}")
        return jsonify({'error': f'Failed to create signal: {str(e)}'}), 500

@signals_bp.route('/signals', methods=['GET'])
def get_signals():
    """Get all trading signals"""
    try:
        # Get all signals, ordered by newest first
        signals = Signal.query.order_by(Signal.timestamp.desc()).all()
        
        # Convert to frontend format and remove duplicates
        signals_data = []
        seen_signals = set()
        for signal in signals:
            signal_dict = signal.to_dict()
            # Create a unique identifier for the signal based on its content
            signal_identifier = (
                signal_dict['pair'],
                signal_dict['timeframe'],
                signal_dict['type'],
                signal_dict['entry'],
                signal_dict['stopLoss'],
                tuple(signal_dict['takeProfit'])
            )
            if signal_identifier not in seen_signals:
                signals_data.append(signal_dict)
                seen_signals.add(signal_identifier)
        
        return jsonify(signals_data), 200
        
    except Exception as e:
        print(f"Error fetching signals: {str(e)}")
        return jsonify({'error': f'Failed to fetch signals: {str(e)}'}), 500

@signals_bp.route('/signals/<signal_id>', methods=['PUT'])
def update_signal_status(signal_id):
    """Update signal status (e.g., mark as hit, expired)"""
    try:
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'Status is required'}), 422
        
        signal = Signal.query.filter_by(signal_id=signal_id).first()
        if not signal:
            return jsonify({'error': 'Signal not found'}), 404
        
        signal.status = data['status']
        db.session.commit()
        
        # Emit status update to all users
        socketio.emit('signalStatusUpdate', {
            'signalId': signal_id,
            'status': data['status']
        })
        
        return jsonify({'message': 'Signal status updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating signal status: {str(e)}")
        return jsonify({'error': f'Failed to update signal status: {str(e)}'}), 500

@signals_bp.route('/signals/<signal_id>', methods=['DELETE'])
def delete_signal(signal_id):
    """Delete a signal"""
    try:
        signal = Signal.query.filter_by(signal_id=signal_id).first()
        if not signal:
            return jsonify({'error': 'Signal not found'}), 404
        
        db.session.delete(signal)
        db.session.commit()
        
        # Emit deletion to all users
        socketio.emit('signalDeleted', {'signalId': signal_id})
        
        return jsonify({'message': 'Signal deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting signal: {str(e)}")
        return jsonify({'error': f'Failed to delete signal: {str(e)}'}), 500

@signals_bp.route('/signals/stats', methods=['GET'])
def get_signal_stats():
    """Get signal statistics for admin dashboard"""
    try:
        total_signals = Signal.query.count()
        active_signals = Signal.query.filter_by(status='active').count()
        hit_signals = Signal.query.filter_by(status='hit').count()
        expired_signals = Signal.query.filter_by(status='expired').count()
        
        # Get today's signals
        today = datetime.utcnow().date()
        today_signals = Signal.query.filter(
            db.func.date(Signal.timestamp) == today
        ).count()
        
        stats = {
            'total': total_signals,
            'active': active_signals,
            'hit': hit_signals,
            'expired': expired_signals,
            'today': today_signals
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        print(f"Error fetching signal stats: {str(e)}")
        return jsonify({'error': f'Failed to fetch signal stats: {str(e)}'}), 500
