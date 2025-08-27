from flask import Blueprint, request, jsonify, current_app
from .models import BotStatus, BotData, OHLCData, db
from .extensions import db
from datetime import datetime, timedelta
import json
from decimal import Decimal
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot_bp = Blueprint('bot', __name__)

# M-PIN for database dashboard access
DATABASE_MPIN = "231806"

@bot_bp.route('/bot/status', methods=['GET'])
def get_bot_status():
    """Get current status of all bots"""
    try:
        bots = BotStatus.query.all()
        status_data = {}
        
        for bot in bots:
            status_data[bot.bot_type] = {
                'is_active': bot.is_active,
                'last_started': bot.last_started.isoformat() if bot.last_started else None,
                'last_stopped': bot.last_stopped.isoformat() if bot.last_stopped else None,
                'status_updated_at': bot.status_updated_at.isoformat(),
                'updated_by': bot.updated_by
            }
        
        return jsonify({
            'success': True,
            'data': status_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting bot status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get bot status'
        }), 500

@bot_bp.route('/bot/status', methods=['POST'])
def update_bot_status():
    """Update bot active/inactive status"""
    try:
        data = request.get_json()
        
        if not data or 'bot_type' not in data or 'is_active' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: bot_type, is_active'
            }), 400
        
        bot_type = data['bot_type']
        is_active = data['is_active']
        updated_by = data.get('updated_by', 'system')
        
        # Find existing bot status or create new one
        bot_status = BotStatus.query.filter_by(bot_type=bot_type).first()
        
        if not bot_status:
            bot_status = BotStatus(bot_type=bot_type)
            db.session.add(bot_status)
        
        # Update status
        bot_status.is_active = is_active
        bot_status.status_updated_at = datetime.utcnow()
        bot_status.updated_by = updated_by
        
        if is_active:
            bot_status.last_started = datetime.utcnow()
        else:
            bot_status.last_stopped = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"Bot {bot_type} status updated to {'Active' if is_active else 'Inactive'}")
        
        return jsonify({
            'success': True,
            'message': f'Bot {bot_type} status updated successfully',
            'data': {
                'bot_type': bot_type,
                'is_active': is_active,
                'status_updated_at': bot_status.status_updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating bot status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update bot status'
        }), 500

@bot_bp.route('/bot/data', methods=['POST'])
def store_bot_data():
    """Store bot data (prices, signals, etc.)"""
    try:
        data = request.get_json()
        
        if not data or 'bot_type' not in data or 'pair' not in data or 'price' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: bot_type, pair, price'
            }), 400
        
        # Create new bot data entry
        bot_data = BotData(
            bot_type=data['bot_type'],
            pair=data['pair'],
            timestamp=datetime.utcnow(),
            price=Decimal(str(data['price'])),
            signal_type=data.get('signal_type', 'neutral'),
            signal_strength=Decimal(str(data['signal_strength'])) if data.get('signal_strength') else None,
            is_recommended=data.get('is_recommended', False),
            volume=Decimal(str(data['volume'])) if data.get('volume') else None,
            high=Decimal(str(data['high'])) if data.get('high') else None,
            low=Decimal(str(data['low'])) if data.get('low') else None,
            open_price=Decimal(str(data['open_price'])) if data.get('open_price') else None,
            close_price=Decimal(str(data['close_price'])) if data.get('close_price') else None,
            timeframe=data.get('timeframe', '1m')
        )
        
        db.session.add(bot_data)
        db.session.commit()
        
        # Also store OHLC data if available
        if all(key in data for key in ['open_price', 'high', 'low', 'close_price', 'timeframe']):
            ohlc_data = OHLCData(
                pair=data['pair'],
                timeframe=data['timeframe'],
                timestamp=datetime.utcnow(),
                open_price=Decimal(str(data['open_price'])),
                high_price=Decimal(str(data['high'])),
                low_price=Decimal(str(data['low'])),
                close_price=Decimal(str(data['close_price'])),
                volume=Decimal(str(data['volume'])) if data.get('volume') else None
            )
            db.session.add(ohlc_data)
            db.session.commit()
        
        logger.info(f"Bot data stored for {data['bot_type']} - {data['pair']}")
        
        return jsonify({
            'success': True,
            'message': 'Bot data stored successfully',
            'data_id': bot_data.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error storing bot data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to store bot data'
        }), 500

@bot_bp.route('/bot/data', methods=['GET'])
def get_bot_data():
    """Get bot data with optional filtering"""
    try:
        bot_type = request.args.get('bot_type')
        pair = request.args.get('pair')
        limit = request.args.get('limit', 100, type=int)
        timeframe = request.args.get('timeframe')
        
        query = BotData.query
        
        if bot_type:
            query = query.filter_by(bot_type=bot_type)
        if pair:
            query = query.filter_by(pair=pair)
        
        # Get latest data
        bot_data = query.order_by(BotData.timestamp.desc()).limit(limit).all()
        
        data_list = []
        for item in bot_data:
            data_list.append({
                'id': item.id,
                'bot_type': item.bot_type,
                'pair': item.pair,
                'timestamp': item.timestamp.isoformat(),
                'price': float(item.price),
                'signal_type': item.signal_type,
                'signal_strength': float(item.signal_strength) if item.signal_strength else None,
                'is_recommended': item.is_recommended,
                'volume': float(item.volume) if item.volume else None,
                'high': float(item.high) if item.high else None,
                'low': float(item.low) if item.low else None,
                'open_price': float(item.open_price) if item.open_price else None,
                'close_price': float(item.close_price) if item.close_price else None,
                'timeframe': item.timeframe
            })
        
        return jsonify({
            'success': True,
            'data': data_list,
            'count': len(data_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting bot data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get bot data'
        }), 500

@bot_bp.route('/bot/ohlc', methods=['GET'])
def get_ohlc_data():
    """Get OHLC data for charting"""
    try:
        pair = request.args.get('pair')
        timeframe = request.args.get('timeframe', '1m')
        limit = request.args.get('limit', 100, type=int)
        
        if not pair:
            return jsonify({
                'success': False,
                'error': 'Pair parameter is required'
            }), 400
        
        query = OHLCData.query.filter_by(pair=pair, timeframe=timeframe)
        ohlc_data = query.order_by(OHLCData.timestamp.desc()).limit(limit).all()
        
        data_list = []
        for item in ohlc_data:
            data_list.append({
                'time': item.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'open': float(item.open_price),
                'high': float(item.high_price),
                'low': float(item.low_price),
                'close': float(item.close_price),
                'volume': float(item.volume) if item.volume else None
            })
        
        # Reverse to get chronological order for charts
        data_list.reverse()
        
        return jsonify({
            'success': True,
            'data': data_list,
            'count': len(data_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting OHLC data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get OHLC data'
        }), 500

@bot_bp.route('/bot/dashboard/auth', methods=['POST'])
def authenticate_dashboard():
    """Authenticate database dashboard access with M-PIN"""
    try:
        data = request.get_json()
        
        if not data or 'mpin' not in data:
            return jsonify({
                'success': False,
                'error': 'M-PIN is required'
            }), 400
        
        mpin = data['mpin']
        
        if mpin == DATABASE_MPIN:
            return jsonify({
                'success': True,
                'message': 'Authentication successful',
                'authenticated': True
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid M-PIN',
                'authenticated': False
            }), 401
        
    except Exception as e:
        logger.error(f"Error in dashboard authentication: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Authentication failed'
        }), 500

@bot_bp.route('/bot/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics for authenticated users"""
    try:
        # Get total counts
        total_signals = BotData.query.count()
        buy_signals = BotData.query.filter_by(signal_type='buy').count()
        sell_signals = BotData.query.filter_by(signal_type='sell').count()
        recommended_signals = BotData.query.filter_by(is_recommended=True).count()
        
        # Get recent bot data
        recent_bot_data = BotData.query.order_by(BotData.timestamp.desc()).limit(10).all()
        
        # Get bot status
        bot_status = BotStatus.query.all()
        
        stats = {
            'total_signals': total_signals,
            'buy_signals': buy_signals,
            'sell_signals': sell_signals,
            'recommended_signals': recommended_signals,
            'recent_bot_data': [
                {
                    'bot_type': item.bot_type,
                    'pair': item.pair,
                    'price': float(item.price),
                    'signal_type': item.signal_type,
                    'timestamp': item.timestamp.isoformat()
                } for item in recent_bot_data
            ],
            'bot_status': [
                {
                    'bot_type': bot.bot_type,
                    'is_active': bot.is_active,
                    'last_started': bot.last_started.isoformat() if bot.last_started else None,
                    'last_stopped': bot.last_stopped.isoformat() if bot.last_stopped else None
                } for bot in bot_status
            ]
        }
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get dashboard statistics'
        }), 500

@bot_bp.route('/bot/start', methods=['POST'])
def start_bot():
    """Start a specific bot"""
    try:
        data = request.get_json()
        
        if not data or 'bot_type' not in data:
            return jsonify({
                'success': False,
                'error': 'Bot type is required'
            }), 400
        
        bot_type = data['bot_type']
        
        # Update bot status to active
        bot_status = BotStatus.query.filter_by(bot_type=bot_type).first()
        
        if not bot_status:
            bot_status = BotStatus(bot_type=bot_type)
            db.session.add(bot_status)
        
        bot_status.is_active = True
        bot_status.last_started = datetime.utcnow()
        bot_status.status_updated_at = datetime.utcnow()
        bot_status.updated_by = data.get('updated_by', 'system')
        
        db.session.commit()
        
        logger.info(f"Bot {bot_type} started successfully")
        
        return jsonify({
            'success': True,
            'message': f'Bot {bot_type} started successfully',
            'data': {
                'bot_type': bot_type,
                'is_active': True,
                'last_started': bot_status.last_started.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error starting bot: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to start bot'
        }), 500

@bot_bp.route('/bot/stop', methods=['POST'])
def stop_bot():
    """Stop a specific bot"""
    try:
        data = request.get_json()
        
        if not data or 'bot_type' not in data:
            return jsonify({
                'success': False,
                'error': 'Bot type is required'
            }), 400
        
        bot_type = data['bot_type']
        
        # Update bot status to inactive
        bot_status = BotStatus.query.filter_by(bot_type=bot_type).first()
        
        if not bot_status:
            return jsonify({
                'success': False,
                'error': f'Bot {bot_type} not found'
            }), 404
        
        bot_status.is_active = False
        bot_status.last_stopped = datetime.utcnow()
        bot_status.status_updated_at = datetime.utcnow()
        bot_status.updated_by = data.get('updated_by', 'system')
        
        db.session.commit()
        
        logger.info(f"Bot {bot_type} stopped successfully")
        
        return jsonify({
            'success': True,
            'message': f'Bot {bot_type} stopped successfully',
            'data': {
                'bot_type': bot_type,
                'is_active': False,
                'last_stopped': bot_status.last_stopped.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error stopping bot: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to stop bot'
        }), 500
