"""
User Signals API - Fetch User-Specific Signals
Handles signal retrieval for users based on their risk profile
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any

from .signal_models import Signal, UserSignal, db
from .models import User
from .auth_middleware import session_required
from .dual_db_service import dual_db

logger = logging.getLogger(__name__)

user_signals_bp = Blueprint('user_signals', __name__)

@user_signals_bp.route('/user/signals', methods=['GET', 'OPTIONS'])
@jwt_required()
@session_required
def get_user_signals():
    """
    Fetch signals for the authenticated user based on their risk tier
    
    Query params:
        - limit: Maximum number of signals (default: 50, max: 200)
        - since: ISO timestamp to get signals since (optional)
        - include_delivered: Include delivery status (default: false)
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get user info
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's risk tier
        user_risk_tier = getattr(user, 'risk_tier', 'medium')
        if not user_risk_tier:
            user_risk_tier = 'medium'  # Default fallback
        
        # Get query parameters
        limit = min(int(request.args.get('limit', 50)), 200)  # Cap at 200
        since_param = request.args.get('since')
        include_delivered = request.args.get('include_delivered', 'false').lower() == 'true'
        
        # Parse since timestamp if provided
        since_date = None
        if since_param:
            try:
                since_date = datetime.fromisoformat(since_param.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid since timestamp format'}), 400
        
        # Build query for signals matching user's risk tier
        query = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin'
        )
        
        # Apply since filter if provided
        if since_date:
            query = query.filter(Signal.created_at >= since_date)
        
        # Execute query
        signals = query.order_by(Signal.created_at.desc()).limit(limit).all()
        
        # Convert signals to dict and add delivery status if requested
        signals_data = []
        for signal in signals:
            signal_dict = signal.to_dict()
            
            if include_delivered:
                # Check delivery status
                user_signal = UserSignal.query.filter_by(
                    user_id=str(user.uuid),
                    signal_id=str(signal.id)
                ).first()
                
                signal_dict['delivered'] = user_signal.delivered if user_signal else False
                signal_dict['delivered_at'] = user_signal.delivered_at.isoformat() if user_signal and user_signal.delivered_at else None
            
            signals_data.append(signal_dict)
        
        logger.info(f"Fetched {len(signals_data)} signals for user {user_id} (risk_tier: {user_risk_tier})")
        
        return jsonify({
            'success': True,
            'signals': signals_data,
            'count': len(signals_data),
            'user_risk_tier': user_risk_tier,
            'filters': {
                'limit': limit,
                'since': since_param,
                'include_delivered': include_delivered
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching user signals: {e}")
        return jsonify({'error': f'Failed to fetch signals: {str(e)}'}), 500

@user_signals_bp.route('/user/signals/recent', methods=['GET', 'OPTIONS'])
@jwt_required()
@session_required
def get_recent_signals():
    """
    Get recent signals for user (last 24 hours)
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get user info
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's risk tier
        user_risk_tier = getattr(user, 'risk_tier', 'medium')
        if not user_risk_tier:
            user_risk_tier = 'medium'
        
        # Get signals from last 24 hours
        since_date = datetime.utcnow() - timedelta(hours=24)
        
        signals = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin',
            Signal.created_at >= since_date
        ).order_by(Signal.created_at.desc()).all()
        
        signals_data = [signal.to_dict() for signal in signals]
        
        return jsonify({
            'success': True,
            'signals': signals_data,
            'count': len(signals_data),
            'period': '24_hours',
            'user_risk_tier': user_risk_tier
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching recent signals: {e}")
        return jsonify({'error': f'Failed to fetch recent signals: {str(e)}'}), 500

@user_signals_bp.route('/user/signals/<signal_id>/delivered', methods=['POST', 'OPTIONS'])
@jwt_required()
@session_required
def mark_signal_delivered(signal_id):
    """
    Mark a signal as delivered to the user (called by frontend when signal is received)
    
    Args:
        signal_id: UUID of the signal
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get user info
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify signal exists and is active
        signal = Signal.query.get(signal_id)
        if not signal:
            return jsonify({'error': 'Signal not found'}), 404
        
        if signal.status != 'active':
            return jsonify({'error': 'Signal is not active'}), 400
        
        # Mark as delivered
        UserSignal.mark_delivered(str(user.uuid), signal_id)
        
        logger.info(f"Marked signal {signal_id} as delivered to user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Signal marked as delivered'
        }), 200
        
    except Exception as e:
        logger.error(f"Error marking signal as delivered: {e}")
        return jsonify({'error': f'Failed to mark signal as delivered: {str(e)}'}), 500

@user_signals_bp.route('/user/signals/stats', methods=['GET', 'OPTIONS'])
@jwt_required()
@session_required
def get_user_signal_stats():
    """
    Get signal statistics for the authenticated user
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get user info
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_risk_tier = getattr(user, 'risk_tier', 'medium')
        if not user_risk_tier:
            user_risk_tier = 'medium'
        
        # Get user's signal statistics
        total_signals = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin'
        ).count()
        
        # Get delivered signals count
        delivered_count = db.session.query(UserSignal).join(Signal).filter(
            UserSignal.user_id == str(user.uuid),
            UserSignal.delivered == True,
            Signal.status == 'active',
            Signal.origin == 'admin'
        ).count()
        
        # Get recent signals (last 7 days)
        since_date = datetime.utcnow() - timedelta(days=7)
        recent_signals = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin',
            Signal.created_at >= since_date
        ).count()
        
        # Get latest signal
        latest_signal = Signal.query.filter(
            Signal.risk_tier == user_risk_tier.lower(),
            Signal.status == 'active',
            Signal.origin == 'admin'
        ).order_by(Signal.created_at.desc()).first()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_signals': total_signals,
                'delivered_signals': delivered_count,
                'recent_signals_7d': recent_signals,
                'user_risk_tier': user_risk_tier,
                'latest_signal': latest_signal.to_dict() if latest_signal else None
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching user signal stats: {e}")
        return jsonify({'error': f'Failed to fetch signal stats: {str(e)}'}), 500
