"""
Admin Signals API - Real-time Signal Creation
Handles signal creation from admin dashboard with Redis publishing
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
import uuid
import logging
from typing import Dict, Any

from .signal_models import Signal, UserSignal, SignalRiskMap, db
from .redis_service import redis_service
from .models import User
from .auth_middleware import session_required

logger = logging.getLogger(__name__)

admin_signals_bp = Blueprint('admin_signals', __name__)

def validate_signal_data(data: Dict[str, Any]) -> tuple[bool, str, Dict[str, Any]]:
    """
    Validate signal creation data
    
    Args:
        data: Request data
        
    Returns:
        Tuple of (is_valid, error_message, cleaned_data)
    """
    required_fields = ['symbol', 'side', 'entry_price', 'stop_loss', 'take_profit', 'risk_tier']
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    
    if missing_fields:
        return False, f'Missing required fields: {missing_fields}', {}
    
    # Validate side
    if data['side'].lower() not in ['buy', 'sell']:
        return False, 'Side must be "buy" or "sell"', {}
    
    # Validate risk tier
    if data['risk_tier'].lower() not in ['low', 'medium', 'high']:
        return False, 'Risk tier must be "low", "medium", or "high"', {}
    
    # Validate numeric fields
    try:
        entry_price = float(data['entry_price'])
        stop_loss = float(data['stop_loss'])
        take_profit = float(data['take_profit'])
        
        if entry_price <= 0 or stop_loss <= 0 or take_profit <= 0:
            return False, 'Prices must be positive numbers', {}
            
    except (ValueError, TypeError):
        return False, 'Entry price, stop loss, and take profit must be valid numbers', {}
    
    # Clean and prepare data
    cleaned_data = {
        'symbol': data['symbol'].upper().strip(),
        'side': data['side'].lower(),
        'entry_price': entry_price,
        'stop_loss': stop_loss,
        'take_profit': take_profit,
        'risk_tier': data['risk_tier'].lower(),
        'payload': data.get('payload', {})
    }
    
    return True, '', cleaned_data

def get_users_by_risk_tier(risk_tier: str) -> list:
    """
    Get all users with a specific risk tier
    
    Args:
        risk_tier: Risk tier to filter by
        
    Returns:
        List of user IDs
    """
    try:
        users = User.query.filter_by(risk_tier=risk_tier.lower()).all()
        return [str(user.uuid) for user in users]
    except Exception as e:
        logger.error(f"Error fetching users by risk tier: {e}")
        return []

@admin_signals_bp.route('/admin/signals', methods=['POST', 'OPTIONS'])
@jwt_required()
@session_required
def create_signal():
    """
    Create a new trading signal from admin dashboard
    
    Expected JSON body:
    {
        "symbol": "BTCUSD",
        "side": "buy",
        "entry_price": 46000,
        "stop_loss": 45500,
        "take_profit": 48000,
        "risk_tier": "medium",
        "payload": {
            "timeframe": "1H",
            "tags": ["FVG", "Liquidity"],
            "analysis": "Strong bullish momentum"
        }
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get admin user info
        admin_id = get_jwt_identity()
        claims = get_jwt()
        
        # Check if user is admin (you may want to add role checking here)
        admin_user = User.query.get(admin_id)
        if not admin_user:
            return jsonify({'error': 'Admin user not found'}), 404
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate signal data
        is_valid, error_msg, cleaned_data = validate_signal_data(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 422
        
        # Create signal in database
        signal = Signal.create_signal(
            symbol=cleaned_data['symbol'],
            side=cleaned_data['side'],
            entry_price=cleaned_data['entry_price'],
            stop_loss=cleaned_data['stop_loss'],
            take_profit=cleaned_data['take_profit'],
            risk_tier=cleaned_data['risk_tier'],
            payload=cleaned_data['payload'],
            created_by=str(admin_user.uuid)
        )
        
        db.session.add(signal)
        db.session.commit()
        
        logger.info(f"Created signal {signal.id} by admin {admin_id}")
        
        # Create user-signal mappings for all users with matching risk tier
        user_ids = get_users_by_risk_tier(cleaned_data['risk_tier'])
        for user_id in user_ids:
            UserSignal.create_user_signal_mapping(user_id, str(signal.id))
        
        logger.info(f"Created {len(user_ids)} user-signal mappings for signal {signal.id}")
        
        # Publish to Redis for real-time distribution
        signal_data = signal.to_dict()
        redis_published = redis_service.publish_signal(signal_data)
        
        if not redis_published:
            logger.warning(f"Failed to publish signal {signal.id} to Redis")
        
        # Return created signal
        return jsonify({
            'success': True,
            'message': 'Signal created successfully',
            'signal': signal_data,
            'users_notified': len(user_ids),
            'redis_published': redis_published
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating signal: {e}")
        db.session.rollback()
        return jsonify({'error': f'Failed to create signal: {str(e)}'}), 500

@admin_signals_bp.route('/admin/signals/<signal_id>/archive', methods=['PATCH', 'OPTIONS'])
@jwt_required()
@session_required
def archive_signal(signal_id):
    """
    Archive a signal (admin only)
    
    Args:
        signal_id: UUID of signal to archive
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get admin user info
        admin_id = get_jwt_identity()
        
        # Find signal
        signal = Signal.query.get(signal_id)
        if not signal:
            return jsonify({'error': 'Signal not found'}), 404
        
        if signal.status == 'archived':
            return jsonify({'error': 'Signal is already archived'}), 400
        
        # Archive signal
        signal.status = 'archived'
        signal.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Archived signal {signal_id} by admin {admin_id}")
        
        return jsonify({
            'success': True,
            'message': 'Signal archived successfully',
            'signal': signal.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error archiving signal: {e}")
        db.session.rollback()
        return jsonify({'error': f'Failed to archive signal: {str(e)}'}), 500

@admin_signals_bp.route('/admin/signals', methods=['GET', 'OPTIONS'])
@jwt_required()
@session_required
def get_admin_signals():
    """
    Get all signals created by admin (for admin dashboard)
    
    Query params:
        - limit: Maximum number of signals (default: 100)
        - status: Filter by status (active/archived, default: all)
        - risk_tier: Filter by risk tier
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get query parameters
        limit = min(int(request.args.get('limit', 100)), 1000)  # Cap at 1000
        status = request.args.get('status')
        risk_tier = request.args.get('risk_tier')
        
        # Build query
        query = Signal.query.filter_by(origin='admin')
        
        if status:
            query = query.filter_by(status=status)
        
        if risk_tier:
            query = query.filter_by(risk_tier=risk_tier.lower())
        
        # Execute query
        signals = query.order_by(Signal.created_at.desc()).limit(limit).all()
        
        # Convert to dict
        signals_data = [signal.to_dict() for signal in signals]
        
        return jsonify({
            'success': True,
            'signals': signals_data,
            'count': len(signals_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching admin signals: {e}")
        return jsonify({'error': f'Failed to fetch signals: {str(e)}'}), 500

@admin_signals_bp.route('/admin/signals/stats', methods=['GET', 'OPTIONS'])
@jwt_required()
@session_required
def get_signal_stats():
    """
    Get signal statistics for admin dashboard
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get basic stats
        total_signals = Signal.query.filter_by(origin='admin').count()
        active_signals = Signal.query.filter_by(origin='admin', status='active').count()
        archived_signals = Signal.query.filter_by(origin='admin', status='archived').count()
        
        # Get signals by risk tier
        risk_tier_stats = db.session.query(
            Signal.risk_tier,
            db.func.count(Signal.id).label('count')
        ).filter_by(origin='admin', status='active').group_by(Signal.risk_tier).all()
        
        # Get recent signals (last 24 hours)
        from datetime import datetime, timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_signals = Signal.query.filter(
            Signal.origin == 'admin',
            Signal.created_at >= yesterday
        ).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_signals': total_signals,
                'active_signals': active_signals,
                'archived_signals': archived_signals,
                'recent_signals_24h': recent_signals,
                'by_risk_tier': {stat.risk_tier: stat.count for stat in risk_tier_stats}
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching signal stats: {e}")
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500
