from flask import Blueprint, request, jsonify
from .models import db, BotData, BotStatus, OHLCData, UserSignal, SignalFeed
from datetime import datetime, timedelta
import json
from sqlalchemy import func

database_bp = Blueprint('database', __name__)

@database_bp.route('/api/database/bot-data', methods=['GET'])
def get_bot_data():
    """Get all bot data with optional filtering"""
    try:
        # Get query parameters
        bot_type = request.args.get('bot_type')
        pair = request.args.get('pair')
        limit = request.args.get('limit', 1000, type=int)
        
        # Build query
        query = BotData.query
        
        if bot_type:
            query = query.filter_by(bot_type=bot_type)
        if pair:
            query = query.filter_by(pair=pair)
        
        # Order by newest first and limit results
        bot_data = query.order_by(BotData.timestamp.desc()).limit(limit).all()
        
        # Convert to list of dictionaries
        data_list = []
        for item in bot_data:
            data_list.append({
                'id': item.id,
                'bot_type': item.bot_type,
                'pair': item.pair,
                'timestamp': item.timestamp.isoformat() if item.timestamp else None,
                'price': float(item.price) if item.price else 0,
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
        
        return jsonify(data_list), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch bot data: {str(e)}'}), 500

@database_bp.route('/api/database/bot-status', methods=['GET'])
def get_bot_status():
    """Get current status of all bots"""
    try:
        bot_statuses = BotStatus.query.all()
        
        status_list = []
        for status in bot_statuses:
            status_list.append({
                'bot_type': status.bot_type,
                'is_active': status.is_active,
                'last_started': status.last_started.isoformat() if status.last_started else None,
                'last_stopped': status.last_stopped.isoformat() if status.last_stopped else None,
                'status_updated_at': status.status_updated_at.isoformat() if status.status_updated_at else None,
                'updated_by': status.updated_by
            })
        
        return jsonify(status_list), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch bot status: {str(e)}'}), 500

@database_bp.route('/api/database/bot-status/<bot_type>', methods=['POST'])
def update_bot_status(bot_type):
    """Update bot active/inactive status"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 422
        
        is_active = data.get('is_active')
        if is_active is None:
            return jsonify({'error': 'is_active field is required'}), 422
        
        # Find existing bot status or create new one
        bot_status = BotStatus.query.filter_by(bot_type=bot_type).first()
        
        if bot_status:
            # Update existing status
            old_status = bot_status.is_active
            bot_status.is_active = is_active
            bot_status.status_updated_at = datetime.utcnow()
            
            # Update timestamps
            if is_active and not old_status:
                bot_status.last_started = datetime.utcnow()
            elif not is_active and old_status:
                bot_status.last_stopped = datetime.utcnow()
                
        else:
            # Create new bot status
            bot_status = BotStatus(
                bot_type=bot_type,
                is_active=is_active,
                status_updated_at=datetime.utcnow()
            )
            if is_active:
                bot_status.last_started = datetime.utcnow()
            db.session.add(bot_status)
        
        db.session.commit()
        
        return jsonify({
            'message': f'{bot_type} bot status updated successfully',
            'bot_type': bot_type,
            'is_active': is_active
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update bot status: {str(e)}'}), 500

@database_bp.route('/api/database/ohlc-data', methods=['GET'])
def get_ohlc_data():
    """Get OHLC data for charting"""
    try:
        # Get query parameters
        pair = request.args.get('pair')
        timeframe = request.args.get('timeframe', '1h')
        limit = request.args.get('limit', 1000, type=int)
        
        # Build query
        query = OHLCData.query.filter_by(timeframe=timeframe)
        
        if pair:
            query = query.filter_by(pair=pair)
        
        # Order by timestamp and limit results
        ohlc_data = query.order_by(OHLCData.timestamp.desc()).limit(limit).all()
        
        # Group by pair
        data_by_pair = {}
        for item in ohlc_data:
            if item.pair not in data_by_pair:
                data_by_pair[item.pair] = []
            
            data_by_pair[item.pair].append({
                'time': item.timestamp.isoformat() if item.timestamp else None,
                'open': float(item.open_price) if item.open_price else 0,
                'high': float(item.high_price) if item.high_price else 0,
                'low': float(item.low_price) if item.low_price else 0,
                'close': float(item.close_price) if item.close_price else 0,
                'volume': float(item.volume) if item.volume else 0
            })
        
        # Sort each pair's data by timestamp (oldest first for charts)
        for pair_data in data_by_pair.values():
            pair_data.sort(key=lambda x: x['time'])
        
        return jsonify(data_by_pair), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch OHLC data: {str(e)}'}), 500

@database_bp.route('/api/database/store-bot-data', methods=['POST'])
def store_bot_data():
    """Store new bot data from bots"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 422
        
        # Validate required fields
        required_fields = ['bot_type', 'pair', 'price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 422
        
        # Create new bot data entry
        new_bot_data = BotData(
            bot_type=data['bot_type'],
            pair=data['pair'],
            price=data['price'],
            signal_type=data.get('signal_type'),
            signal_strength=data.get('signal_strength'),
            is_recommended=data.get('is_recommended', False),
            volume=data.get('volume'),
            high=data.get('high'),
            low=data.get('low'),
            open_price=data.get('open_price'),
            close_price=data.get('close_price'),
            timeframe=data.get('timeframe')
        )
        
        db.session.add(new_bot_data)
        db.session.commit()
        
        return jsonify({
            'message': 'Bot data stored successfully',
            'id': new_bot_data.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to store bot data: {str(e)}'}), 500

@database_bp.route('/api/database/store-ohlc', methods=['POST'])
def store_ohlc_data():
    """Store OHLC candle data"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 422
        
        # Validate required fields
        required_fields = ['pair', 'timeframe', 'timestamp', 'open', 'high', 'low', 'close']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 422
        
        # Parse timestamp
        try:
            if isinstance(data['timestamp'], str):
                timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            else:
                timestamp = datetime.fromtimestamp(data['timestamp'])
        except Exception:
            return jsonify({'error': 'Invalid timestamp format'}), 422
        
        # Create new OHLC entry
        new_ohlc = OHLCData(
            pair=data['pair'],
            timeframe=data['timeframe'],
            timestamp=timestamp,
            open_price=data['open'],
            high_price=data['high'],
            low_price=data['low'],
            close_price=data['close'],
            volume=data.get('volume')
        )
        
        db.session.add(new_ohlc)
        db.session.commit()
        
        return jsonify({
            'message': 'OHLC data stored successfully',
            'id': new_ohlc.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to store OHLC data: {str(e)}'}), 500

@database_bp.route('/api/database/user-signals', methods=['GET'])
def get_user_signals():
    """Get user signal history"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id parameter is required'}), 422
        
        # Get query parameters
        pair = request.args.get('pair')
        result = request.args.get('result')
        limit = request.args.get('limit', 100, type=int)
        
        # Build query
        query = UserSignal.query.filter_by(user_id=user_id)
        
        if pair:
            query = query.filter_by(pair=pair)
        if result:
            query = query.filter_by(result=result)
        
        # Order by newest first and limit results
        user_signals = query.order_by(UserSignal.timestamp.desc()).limit(limit).all()
        
        # Convert to list of dictionaries
        signal_list = []
        for signal in user_signals:
            signal_list.append({
                'id': signal.id,
                'pair': signal.pair,
                'signal_type': signal.signal_type,
                'result': signal.result,
                'confidence_pct': float(signal.confidence_pct) if signal.confidence_pct else None,
                'is_recommended': signal.is_recommended,
                'timestamp': signal.timestamp.isoformat() if signal.timestamp else None,
                'entry_price': float(signal.entry_price) if signal.entry_price else None,
                'stop_loss': float(signal.stop_loss) if signal.stop_loss else None,
                'take_profit': float(signal.take_profit) if signal.take_profit else None,
                'analysis': signal.analysis,
                'ict_concepts': json.loads(signal.ict_concepts) if signal.ict_concepts else [],
                'pnl': float(signal.pnl) if signal.pnl else None,
                'outcome_timestamp': signal.outcome_timestamp.isoformat() if signal.outcome_timestamp else None,
                'notes': signal.notes
            })
        
        return jsonify(signal_list), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch user signals: {str(e)}'}), 500

@database_bp.route('/api/database/user-signals', methods=['POST'])
def store_user_signal():
    """Store new user signal"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 422
        
        # Validate required fields
        required_fields = ['user_id', 'pair', 'signal_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 422
        
        # Create new user signal entry
        new_signal = UserSignal(
            user_id=data['user_id'],
            pair=data['pair'],
            signal_type=data['signal_type'],
            result=data.get('result'),
            confidence_pct=data.get('confidence_pct'),
            is_recommended=data.get('is_recommended', False),
            entry_price=data.get('entry_price'),
            stop_loss=data.get('stop_loss'),
            take_profit=data.get('take_profit'),
            analysis=data.get('analysis'),
            ict_concepts=json.dumps(data.get('ict_concepts', [])) if data.get('ict_concepts') else None,
            pnl=data.get('pnl'),
            notes=data.get('notes')
        )
        
        db.session.add(new_signal)
        db.session.commit()
        
        return jsonify({
            'message': 'User signal stored successfully',
            'id': new_signal.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to store user signal: {str(e)}'}), 500

@database_bp.route('/api/database/update-signal-outcome', methods=['POST'])
def update_signal_outcome():
    """Update signal outcome (win/loss/skipped)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 422
        
        signal_id = data.get('signal_id')
        result = data.get('result')
        pnl = data.get('pnl')
        notes = data.get('notes')
        
        if not signal_id or not result:
            return jsonify({'error': 'signal_id and result are required'}), 422
        
        # Find the signal
        signal = UserSignal.query.get(signal_id)
        if not signal:
            return jsonify({'error': 'Signal not found'}), 404
        
        # Update the signal
        signal.result = result
        signal.outcome_timestamp = datetime.utcnow()
        if pnl is not None:
            signal.pnl = pnl
        if notes:
            signal.notes = notes
        
        db.session.commit()
        
        return jsonify({
            'message': 'Signal outcome updated successfully',
            'signal_id': signal_id,
            'result': result
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update signal outcome: {str(e)}'}), 500

@database_bp.route('/api/database/signal-stats', methods=['GET'])
def get_signal_stats():
    """Get signal statistics"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id parameter is required'}), 422
        
        # Get signal counts by result
        stats = db.session.query(
            UserSignal.result,
            func.count(UserSignal.id).label('count')
        ).filter_by(user_id=user_id).group_by(UserSignal.result).all()
        
        # Convert to dictionary
        stats_dict = {}
        total_signals = 0
        for stat in stats:
            stats_dict[stat.result] = stat.count
            total_signals += stat.count
        
        # Calculate win rate
        win_rate = 0
        if total_signals > 0:
            wins = stats_dict.get('win', 0)
            win_rate = (wins / total_signals) * 100
        
        return jsonify({
            'total_signals': total_signals,
            'win_rate': round(win_rate, 2),
            'breakdown': stats_dict
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch signal stats: {str(e)}'}), 500
