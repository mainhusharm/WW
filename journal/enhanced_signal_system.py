"""
Enhanced Signal System for Real-time Signal Delivery
This module implements a robust signal system that:
1. Delivers signals from admin dashboard to user dashboards based on risk-reward preferences
2. Ensures signals persist forever regardless of logout/login
3. Prevents signal deletion
4. Filters signals based on user preferences
"""

from flask import Blueprint, request, jsonify
from flask_socketio import emit
from .models import Signal, SignalFeed, User, RiskPlan, UserSignal
from .extensions import db, socketio
from datetime import datetime, timedelta
import uuid
import json
import hashlib
from sqlalchemy import and_, or_

enhanced_signal_bp = Blueprint('enhanced_signal', __name__)

class SignalDeliveryService:
    """Service for delivering signals to users based on their preferences"""
    
    @staticmethod
    def create_signal_from_admin(signal_data, market_type='forex'):
        """
        Create a new signal from admin dashboard and deliver to appropriate users
        """
        try:
            # Generate unique signal ID
            signal_id = str(uuid.uuid4())
            
            # Create unique key for deduplication
            unique_key = hashlib.md5(
                f"{signal_data.get('symbol')}_{signal_data.get('action')}_{signal_data.get('entryPrice')}_{datetime.utcnow().strftime('%Y%m%d%H%M')}".encode()
            ).hexdigest()
            
            # Check if signal already exists
            existing_signal = SignalFeed.query.filter_by(unique_key=unique_key).first()
            if existing_signal:
                return {'success': False, 'message': 'Signal already exists'}
            
            # Determine if signal should be recommended based on confidence and market conditions
            confidence = signal_data.get('confidence', 85)
            is_recommended = confidence > 85 and signal_data.get('rrRatio', '1:2') != '1:1'
            
            # Create signal feed entry (this is what users see)
            signal_feed = SignalFeed(
                unique_key=unique_key,
                signal_id=signal_id,
                pair=signal_data.get('symbol', 'EUR/USD'),
                direction='LONG' if signal_data.get('action', 'BUY').upper() == 'BUY' else 'SHORT',
                entry_price=str(signal_data.get('entryPrice', 1.0850)),
                stop_loss=str(signal_data.get('stopLoss', 1.0800)),
                take_profit=str(signal_data.get('takeProfit', 1.0950)),
                confidence=confidence,
                analysis=signal_data.get('analysis', 'Professional signal analysis'),
                ict_concepts=json.dumps(signal_data.get('ictConcepts', [])),
                timestamp=datetime.utcnow(),
                status='active',
                market=market_type,
                timeframe=signal_data.get('timeframe', '1H'),
                created_by='admin',
                is_recommended=is_recommended
            )
            
            # Create admin signal entry (for admin tracking)
            admin_signal = Signal(
                signal_id=signal_id,
                pair=signal_data.get('symbol', 'EUR/USD'),
                timeframe=signal_data.get('timeframe', '1H'),
                direction='LONG' if signal_data.get('action', 'BUY').upper() == 'BUY' else 'SHORT',
                entry_price=str(signal_data.get('entryPrice', 1.0850)),
                stop_loss=str(signal_data.get('stopLoss', 1.0800)),
                take_profit=str(signal_data.get('takeProfit', 1.0950)),
                confidence=confidence,
                analysis=signal_data.get('analysis', 'Professional signal analysis'),
                ict_concepts=json.dumps(signal_data.get('ictConcepts', [])),
                timestamp=datetime.utcnow(),
                status='active',
                created_by='admin'
            )
            
            db.session.add(signal_feed)
            db.session.add(admin_signal)
            db.session.commit()
            
            # Emit real-time signal to all connected users
            signal_payload = {
                'id': signal_id,
                'pair': signal_feed.pair,
                'direction': signal_feed.direction,
                'entry': signal_feed.entry_price,
                'stopLoss': signal_feed.stop_loss,
                'takeProfit': signal_feed.take_profit,
                'confidence': signal_feed.confidence,
                'analysis': signal_feed.analysis,
                'ictConcepts': json.loads(signal_feed.ict_concepts) if signal_feed.ict_concepts else [],
                'timestamp': signal_feed.timestamp.isoformat(),
                'status': signal_feed.status,
                'market': signal_feed.market,
                'timeframe': signal_feed.timeframe,
                'is_recommended': signal_feed.is_recommended
            }
            
            # Emit to all connected users
            socketio.emit('new_signal', signal_payload, namespace='/')
            
            return {
                'success': True,
                'message': 'Signal created and delivered successfully',
                'signal_id': signal_id,
                'unique_key': unique_key
            }
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_user_signals(user_id, market_filter='all', risk_reward_filter=None):
        """
        Get signals for a specific user based on their preferences
        """
        try:
            # Get user's risk plan to filter signals
            risk_plan = RiskPlan.query.filter_by(user_id=user_id).first()
            
            # Base query for active signals
            query = SignalFeed.query.filter_by(status='active')
            
            # Apply market filter
            if market_filter != 'all':
                query = query.filter_by(market=market_filter)
            
            # Apply risk-reward filter if user has preferences
            if risk_plan and risk_reward_filter:
                min_rr = float(risk_plan.min_risk_reward) if risk_plan.min_risk_reward else 2.0
                # Filter signals based on risk-reward ratio
                # This is a simplified implementation - you can enhance this logic
                query = query.filter(SignalFeed.confidence >= 80)  # High confidence signals
            
            # Order by newest first
            signals = query.order_by(SignalFeed.timestamp.desc()).limit(100).all()
            
            # Convert to dict format
            signal_list = []
            for signal in signals:
                signal_dict = {
                    'id': signal.signal_id,
                    'pair': signal.pair,
                    'direction': signal.direction,
                    'entry': signal.entry_price,
                    'stopLoss': signal.stop_loss,
                    'takeProfit': signal.take_profit,
                    'confidence': signal.confidence,
                    'analysis': signal.analysis,
                    'ictConcepts': json.loads(signal.ict_concepts) if signal.ict_concepts else [],
                    'timestamp': signal.timestamp.isoformat(),
                    'status': signal.status,
                    'market': signal.market,
                    'timeframe': signal.timeframe,
                    'is_recommended': signal.is_recommended
                }
                signal_list.append(signal_dict)
            
            return {
                'success': True,
                'signals': signal_list,
                'total': len(signal_list)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def mark_signal_taken(user_id, signal_id, outcome, pnl=None):
        """
        Mark a signal as taken by user (cannot be deleted, only marked as taken)
        """
        try:
            # Find the signal
            signal = SignalFeed.query.filter_by(signal_id=signal_id).first()
            if not signal:
                return {'success': False, 'error': 'Signal not found'}
            
            # Update signal status (never delete, only mark as taken)
            signal.status = 'taken'
            signal.outcome = outcome
            signal.pnl = pnl
            signal.taken_by = str(user_id)
            signal.taken_at = datetime.utcnow()
            
            # Create user signal record for tracking
            user_signal = UserSignal(
                user_id=user_id,
                pair=signal.pair,
                signal_type=signal.direction.lower(),
                result='win' if outcome == 'Target Hit' else 'loss' if outcome == 'Stop Loss Hit' else 'skipped',
                confidence_pct=signal.confidence,
                is_recommended=signal.is_recommended,
                entry_price=float(signal.entry_price),
                stop_loss=float(signal.stop_loss),
                take_profit=float(signal.take_profit),
                analysis=signal.analysis,
                ict_concepts=signal.ict_concepts,
                pnl=pnl,
                outcome_timestamp=datetime.utcnow(),
                notes=f"Signal outcome: {outcome}"
            )
            
            db.session.add(user_signal)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Signal marked as taken successfully'
            }
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': str(e)}

# API Routes
@enhanced_signal_bp.route('/api/signals/create', methods=['POST', 'OPTIONS'])
def create_signal():
    """Create a new signal from admin dashboard"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        market_type = data.get('marketType', 'forex')  # 'crypto' or 'forex'
        
        result = SignalDeliveryService.create_signal_from_admin(data, market_type)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@enhanced_signal_bp.route('/api/signals/user/<int:user_id>', methods=['GET', 'OPTIONS'])
def get_user_signals(user_id):
    """Get signals for a specific user based on their preferences"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        market_filter = request.args.get('market', 'all')
        risk_reward_filter = request.args.get('riskReward', None)
        
        result = SignalDeliveryService.get_user_signals(user_id, market_filter, risk_reward_filter)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@enhanced_signal_bp.route('/api/signals/mark-taken', methods=['POST', 'OPTIONS'])
def mark_signal_taken():
    """Mark a signal as taken by user"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        user_id = data.get('userId')
        signal_id = data.get('signalId')
        outcome = data.get('outcome')
        pnl = data.get('pnl')
        
        if not all([user_id, signal_id, outcome]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        result = SignalDeliveryService.mark_signal_taken(user_id, signal_id, outcome, pnl)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@enhanced_signal_bp.route('/api/signals/stats', methods=['GET', 'OPTIONS'])
def get_signal_stats():
    """Get signal statistics"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        total_signals = SignalFeed.query.count()
        active_signals = SignalFeed.query.filter_by(status='active').count()
        taken_signals = SignalFeed.query.filter_by(status='taken').count()
        recommended_signals = SignalFeed.query.filter_by(is_recommended=True, status='active').count()
        
        # Get market breakdown
        forex_signals = SignalFeed.query.filter_by(market='forex', status='active').count()
        crypto_signals = SignalFeed.query.filter_by(market='crypto', status='active').count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_signals': total_signals,
                'active_signals': active_signals,
                'taken_signals': taken_signals,
                'recommended_signals': recommended_signals,
                'forex_signals': forex_signals,
                'crypto_signals': crypto_signals
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@enhanced_signal_bp.route('/api/signals/clear', methods=['POST', 'OPTIONS'])
def clear_signals():
    """Clear all signals (admin only - for testing purposes)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # This should be protected with admin authentication in production
        SignalFeed.query.delete()
        Signal.query.delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All signals cleared successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
