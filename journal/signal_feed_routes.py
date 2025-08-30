from flask import Blueprint, request, jsonify
from .models import Signal, SignalFeed
from .extensions import db
from datetime import datetime
import hashlib
import json

signal_feed_bp = Blueprint('signal_feed', __name__)

@signal_feed_bp.route('/api/signals/relay', methods=['POST'])
def relay_signal():
    """Relay a signal from admin to user feed with deduplication"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 422
        
        signal_data = data.get('signal')
        unique_key = data.get('uniqueKey')
        
        if not signal_data or not unique_key:
            return jsonify({'error': 'Missing signal data or unique key'}), 422
        
        # Check if signal already exists using unique key
        existing_signal = SignalFeed.query.filter_by(unique_key=unique_key).first()
        if existing_signal:
            return jsonify({'message': 'Signal already exists', 'exists': True}), 200
        
        # Determine if signal should be marked as recommended
        # Logic: High confidence (>85%) + strong market conditions
        confidence = signal_data.get('confidence', 90)
        is_recommended = confidence > 85  # Can be enhanced with more sophisticated logic
        
        # Create new signal feed entry
        new_signal_feed = SignalFeed(
            unique_key=unique_key,
            signal_id=signal_data.get('id'),
            pair=signal_data.get('pair'),
            direction=signal_data.get('direction'),
            entry_price=str(signal_data.get('entry')),
            stop_loss=str(signal_data.get('stopLoss')),
            take_profit=json.dumps(signal_data.get('takeProfit')) if isinstance(signal_data.get('takeProfit'), list) else str(signal_data.get('takeProfit')),
            confidence=confidence,
            analysis=signal_data.get('analysis', ''),
            ict_concepts=json.dumps(signal_data.get('ictConcepts', [])),
            timestamp=datetime.fromisoformat(signal_data.get('timestamp').replace('Z', '+00:00')),
            status='active',
            market=signal_data.get('market', 'forex'),
            timeframe=signal_data.get('timeframe', ''),
            created_by='admin',
            is_recommended=is_recommended
        )
        
        db.session.add(new_signal_feed)
        db.session.commit()
        
        # Also add to main signals table for admin tracking
        admin_signal = Signal(
            signal_id=signal_data.get('id'),
            pair=signal_data.get('pair'),
            timeframe=signal_data.get('timeframe', ''),
            direction=signal_data.get('direction'),
            entry_price=str(signal_data.get('entry')),
            stop_loss=str(signal_data.get('stopLoss')),
            take_profit=json.dumps(signal_data.get('takeProfit')) if isinstance(signal_data.get('takeProfit'), list) else str(signal_data.get('takeProfit')),
            confidence=signal_data.get('confidence', 90),
            analysis=signal_data.get('analysis', ''),
            ict_concepts=json.dumps(signal_data.get('ictConcepts', [])),
            timestamp=datetime.fromisoformat(signal_data.get('timestamp').replace('Z', '+00:00')),
            status='active',
            created_by='admin'
        )
        
        db.session.add(admin_signal)
        db.session.commit()
        
        return jsonify({'message': 'Signal successfully relayed', 'exists': False}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to relay signal: {str(e)}'}), 500

@signal_feed_bp.route('/api/signals/check/<unique_key>', methods=['GET'])
def check_signal_exists(unique_key):
    """Check if a signal with the given unique key already exists"""
    try:
        existing_signal = SignalFeed.query.filter_by(unique_key=unique_key).first()
        return jsonify({'exists': existing_signal is not None}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to check signal: {str(e)}'}), 500

@signal_feed_bp.route('/api/signals/feed', methods=['GET'])
def get_signal_feed():
    """Get signals for user feed with pagination and deduplication"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        market = request.args.get('market', 'all')
        
        # Build query
        query = SignalFeed.query.filter_by(status='active')
        
        if market != 'all':
            query = query.filter_by(market=market)
        
        # Order by newest first and paginate
        signals = query.order_by(SignalFeed.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Convert to dict format
        signal_list = []
        for signal in signals.items:
            signal_dict = {
                'id': signal.signal_id,
                'pair': signal.pair,
                'direction': signal.direction,
                'entry': signal.entry_price,
                'stopLoss': signal.stop_loss,
                'takeProfit': json.loads(signal.take_profit) if signal.take_profit.startswith('[') else [signal.take_profit],
                'confidence': signal.confidence,
                'analysis': signal.analysis,
                'ictConcepts': json.loads(signal.ict_concepts) if signal.ict_concepts else [],
                'timestamp': signal.timestamp.isoformat(),
                'status': signal.status,
                'market': signal.market,
                'timeframe': signal.timeframe
            }
            signal_list.append(signal_dict)
        
        return jsonify({
            'signals': signal_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': signals.total,
                'pages': signals.pages,
                'has_next': signals.has_next,
                'has_prev': signals.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get signal feed: {str(e)}'}), 500

@signal_feed_bp.route('/api/signals/mark-taken', methods=['POST'])
def mark_signal_taken():
    """Mark a signal as taken by user with outcome tracking"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 422
        
        signal_id = data.get('signalId')
        outcome = data.get('outcome')  # 'Target Hit', 'Stop Loss Hit', 'Breakeven'
        pnl = data.get('pnl')
        user_id = data.get('userId')
        
        if not signal_id or not outcome:
            return jsonify({'error': 'Missing signal ID or outcome'}), 422
        
        # Find signal in feed
        signal = SignalFeed.query.filter_by(signal_id=signal_id).first()
        if not signal:
            return jsonify({'error': 'Signal not found'}), 404
        
        # Update signal status
        signal.status = 'taken'
        signal.outcome = outcome
        signal.pnl = pnl
        signal.taken_by = user_id
        signal.taken_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Signal marked as taken successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to mark signal as taken: {str(e)}'}), 500

@signal_feed_bp.route('/api/signals/stats', methods=['GET'])
def get_signal_stats():
    """Get signal statistics for dashboard"""
    try:
        total_signals = SignalFeed.query.count()
        active_signals = SignalFeed.query.filter_by(status='active').count()
        taken_signals = SignalFeed.query.filter_by(status='taken').count()
        
        # Get outcome statistics
        outcomes = db.session.query(
            SignalFeed.outcome,
            db.func.count(SignalFeed.id)
        ).filter(SignalFeed.status == 'taken').group_by(SignalFeed.outcome).all()
        
        outcome_stats = {outcome: count for outcome, count in outcomes}
        
        return jsonify({
            'total_signals': total_signals,
            'active_signals': active_signals,
            'taken_signals': taken_signals,
            'outcome_stats': outcome_stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get signal stats: {str(e)}'}), 500
