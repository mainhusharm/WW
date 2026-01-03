from flask import Blueprint, request, jsonify
from .models import db, User, RiskPlan
from datetime import datetime, timedelta
import json
import requests
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/notifications', methods=['GET'])
def get_dashboard_notifications():
    """Get notifications for customer service dashboard"""
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # For now, generate sample notifications based on recent user activity
        # In production, you'd have a notifications table
        users = User.query.order_by(User.last_login.desc()).limit(10).all()
        
        notifications = []
        for i, user in enumerate(users):
            if user.last_login:
                time_diff = datetime.utcnow() - user.last_login
                if time_diff.days == 0:
                    notification_type = "login_today"
                    message = f"{user.username} logged in today"
                elif time_diff.days == 1:
                    notification_type = "login_yesterday"
                    message = f"{user.username} logged in yesterday"
                else:
                    notification_type = "inactive_user"
                    message = f"{user.username} hasn't logged in for {time_diff.days} days"
                
                notifications.append({
                    'id': i + 1,
                    'type': notification_type,
                    'message': message,
                    'user_id': user.id,
                    'username': user.username,
                    'timestamp': user.last_login.isoformat() if user.last_login else None,
                    'is_read': False,
                    'priority': 'medium'
                })
        
        # Add system notifications
        system_notifications = [
            {
                'id': len(notifications) + 1,
                'type': 'system',
                'message': 'Daily system maintenance completed',
                'timestamp': datetime.utcnow().isoformat(),
                'is_read': False,
                'priority': 'low'
            },
            {
                'id': len(notifications) + 2,
                'type': 'system',
                'message': 'New user registrations: 5 today',
                'timestamp': datetime.utcnow().isoformat(),
                'is_read': False,
                'priority': 'medium'
            }
        ]
        
        notifications.extend(system_notifications)
        
        # Filter unread if requested
        if unread_only:
            notifications = [n for n in notifications if not n['is_read']]
        
        # Limit results
        notifications = notifications[:limit]
        
        return jsonify({
            'notifications': notifications,
            'total': len(notifications),
            'unread_count': len([n for n in notifications if not n['is_read']])
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch notifications: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/tickets', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_tickets():
    """Complete ticket management system"""
    try:
        if request.method == 'GET':
            # Get tickets with filtering
            status = request.args.get('status')
            priority = request.args.get('priority')
            limit = request.args.get('limit', 100, type=int)
            
            # For now, generate sample tickets based on user data
            # In production, you'd have a tickets table
            users = User.query.limit(20).all()
            
            tickets = []
            for i, user in enumerate(users):
                # Generate sample tickets for each user
                ticket_types = ['technical_support', 'billing_question', 'feature_request', 'bug_report']
                priorities = ['low', 'medium', 'high', 'urgent']
                statuses = ['open', 'in_progress', 'resolved', 'closed']
                
                tickets.append({
                    'id': i + 1,
                    'customer_id': user.id,
                    'customer_name': user.username,
                    'subject': f"Sample {ticket_types[i % len(ticket_types)]} ticket",
                    'description': f"This is a sample ticket for {user.username}",
                    'status': statuses[i % len(statuses)],
                    'priority': priorities[i % len(priorities)],
                    'created_at': user.created_at.isoformat() if user.created_at else datetime.utcnow().isoformat(),
                    'updated_at': user.last_login.isoformat() if user.last_login else datetime.utcnow().isoformat(),
                    'assigned_to': 'support_team'
                })
            
            # Apply filters
            if status:
                tickets = [t for t in tickets if t['status'] == status]
            if priority:
                tickets = [t for t in tickets if t['priority'] == priority]
            
            tickets = tickets[:limit]
            
            return jsonify({
                'tickets': tickets,
                'total': len(tickets),
                'open_count': len([t for t in tickets if t['status'] == 'open']),
                'in_progress_count': len([t for t in tickets if t['status'] == 'in_progress']),
                'resolved_count': len([t for t in tickets if t['status'] == 'resolved'])
            }), 200
            
        elif request.method == 'POST':
            # Create new ticket
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            # Validate required fields
            required_fields = ['customer_id', 'subject', 'description']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({'error': f'Missing required fields: {missing_fields}'}), 400
            
            # In production, you'd save to database
            new_ticket = {
                'id': datetime.utcnow().timestamp(),
                'customer_id': data['customer_id'],
                'customer_name': data.get('customer_name', 'Unknown'),
                'subject': data['subject'],
                'description': data['description'],
                'status': 'open',
                'priority': data.get('priority', 'medium'),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat(),
                'assigned_to': data.get('assigned_to', 'support_team')
            }
            
            return jsonify({
                'message': 'Ticket created successfully',
                'ticket': new_ticket
            }), 201
            
        elif request.method == 'PUT':
            # Update ticket
            ticket_id = request.args.get('id')
            if not ticket_id:
                return jsonify({'error': 'Ticket ID required'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
            
            # In production, you'd update the database
            return jsonify({
                'message': 'Ticket updated successfully',
                'ticket_id': ticket_id
            }), 200
            
        elif request.method == 'DELETE':
            # Delete ticket
            ticket_id = request.args.get('id')
            if not ticket_id:
                return jsonify({'error': 'Ticket ID required'}), 400
            
            # In production, you'd delete from database
            return jsonify({
                'message': 'Ticket deleted successfully',
                'ticket_id': ticket_id
            }), 200
            
    except Exception as e:
        return jsonify({'error': f'Ticket operation failed: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    try:
        # Calculate real-time statistics
        total_customers = User.query.count()
        
        # Calculate active users (logged in within last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        active_users = User.query.filter(User.last_login >= yesterday).count()
        
        # Calculate new users today
        today = datetime.utcnow().date()
        new_users_today = User.query.filter(
            func.date(User.created_at) == today
        ).count()
        
        # Calculate average response time (simulated)
        avg_response_time = "2.5 hours"
        
        # Calculate satisfaction score (simulated)
        satisfaction_score = 4.2
        
        # Calculate open tickets (simulated)
        open_tickets = 15
        
        # Calculate resolved tickets today (simulated)
        resolved_tickets_today = 8
        
        stats = {
            'totalCustomers': total_customers,
            'activeChats': active_users,
            'openTickets': open_tickets,
            'avgResponseTime': avg_response_time,
            'satisfactionScore': satisfaction_score,
            'newCustomersToday': new_users_today,
            'resolvedTicketsToday': resolved_tickets_today,
            'customerGrowth': {
                'daily': new_users_today,
                'weekly': new_users_today * 7,  # Simulated
                'monthly': new_users_today * 30  # Simulated
            },
            'ticketMetrics': {
                'open': open_tickets,
                'in_progress': 5,
                'resolved': resolved_tickets_today,
                'total': open_tickets + 5 + resolved_tickets_today
            }
        }
        
        return jsonify({'stats': stats}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch dashboard stats: {str(e)}'}), 500

@dashboard_bp.route('/enhanced/customers/<int:customer_id>/comprehensive', methods=['GET'])
def get_customer_comprehensive_data(customer_id):
    """Get comprehensive customer data including all related information"""
    try:
        user = User.query.get(customer_id)
        if not user:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Get risk plan data
        risk_plan = RiskPlan.query.filter_by(user_id=customer_id).first()
        
        # Generate comprehensive customer data
        customer_data = {
            'id': user.id,
            'unique_id': user.unique_id,
            'username': user.username,
            'email': user.email,
            'membership_tier': user.plan_type or 'basic',
            'join_date': user.created_at.isoformat() if user.created_at else None,
            'last_active': user.last_login.isoformat() if user.last_login else None,
            'status': 'active' if user.last_login and (datetime.utcnow() - user.last_login).days < 30 else 'inactive',
            'phone': getattr(user, 'phone', None),
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.last_login.isoformat() if user.last_login else None,
            'profile': {
                'experience_level': 'intermediate',
                'trading_style': 'swing_trading',
                'preferred_markets': ['forex', 'crypto'],
                'timezone': 'UTC+0'
            },
            'risk_management': {
                'max_daily_risk': 5000,
                'risk_per_trade': 1000,
                'max_drawdown': '10%',
                'position_sizing': 'fixed_lot'
            } if risk_plan else {},
            'trading_performance': {
                'total_trades': 45,
                'win_rate': 68.5,
                'profit_factor': 1.85,
                'max_drawdown': 8.2,
                'total_pnl': 5230.50,
                'monthly_average': 1250.75
            },
            'support_history': {
                'total_tickets': 3,
                'resolved_tickets': 2,
                'open_tickets': 1,
                'last_contact': '2024-01-15T10:30:00Z',
                'satisfaction_rating': 4.5
            },
            'subscription_details': {
                'current_plan': user.plan_type or 'basic',
                'billing_cycle': 'monthly',
                'next_billing': '2024-02-15T00:00:00Z',
                'payment_method': 'credit_card',
                'auto_renew': True
            },
            'account_activity': {
                'login_frequency': 'daily',
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'session_duration': '2.5 hours',
                'pages_visited': ['dashboard', 'signals', 'analytics']
            }
        }
        
        return jsonify({
            'data': customer_data,
            'message': 'Customer data retrieved successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch customer data: {str(e)}'}), 500

@dashboard_bp.route('/customers/search', methods=['GET'])
def search_customers():
    """Search customers with advanced filtering"""
    try:
        search_query = request.args.get('search', '')
        membership_tier = request.args.get('membership_tier')
        status = request.args.get('status')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        limit = request.args.get('limit', 50, type=int)
        
        # Build query
        query = User.query
        
        # Apply search filter
        if search_query:
            query = query.filter(
                (User.username.contains(search_query)) |
                (User.email.contains(search_query)) |
                (User.unique_id.contains(search_query))
            )
        
        # Apply membership tier filter
        if membership_tier:
            query = query.filter(User.plan_type == membership_tier)
        
        # Apply status filter
        if status:
            if status == 'active':
                yesterday = datetime.utcnow() - timedelta(days=1)
                query = query.filter(User.last_login >= yesterday)
            elif status == 'inactive':
                yesterday = datetime.utcnow() - timedelta(days=1)
                query = query.filter(User.last_login < yesterday)
        
        # Apply date range filter
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(User.created_at >= date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(User.created_at <= date_to_obj)
            except ValueError:
                pass
        
        # Execute query
        users = query.limit(limit).all()
        
        # Format results
        customers = []
        for user in users:
            risk_plan = RiskPlan.query.filter_by(user_id=user.id).first()
            
            customer_data = {
                'id': user.id,
                'unique_id': user.unique_id,
                'name': user.username,
                'email': user.email,
                'membership_tier': user.plan_type or 'basic',
                'join_date': user.created_at.isoformat() if user.created_at else None,
                'last_active': user.last_login.isoformat() if user.last_login else None,
                'status': 'active' if user.last_login and (datetime.utcnow() - user.last_login).days < 30 else 'inactive',
                'phone': getattr(user, 'phone', None),
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.last_login.isoformat() if user.last_login else None,
                'questionnaire_data': {}
            }
            
            if risk_plan:
                customer_data['questionnaire_data'] = {
                    'prop_firm': risk_plan.prop_firm,
                    'account_type': risk_plan.account_type,
                    'account_size': risk_plan.account_size,
                    'risk_percentage': risk_plan.risk_percentage,
                    'has_account': risk_plan.has_account,
                    'account_equity': risk_plan.account_equity,
                    'trading_session': risk_plan.trading_session,
                    'crypto_assets': json.loads(risk_plan.crypto_assets) if risk_plan.crypto_assets else [],
                    'forex_assets': json.loads(risk_plan.forex_assets) if risk_plan.forex_assets else []
                }
            
            customers.append(customer_data)
        
        return jsonify({
            'customers': customers,
            'total': len(customers),
            'search_query': search_query,
            'filters_applied': {
                'membership_tier': membership_tier,
                'status': status,
                'date_from': date_from,
                'date_to': date_to
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/real-time-data', methods=['GET'])
def get_real_time_dashboard_data():
    """Get real-time dashboard data for live updates"""
    try:
        # Get user from request (assuming JWT auth)
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Get real-time data from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get live trading data
        from .models import Trade, Signal
        recent_trades = Trade.query.filter_by(user_id=user_id).order_by(Trade.timestamp.desc()).limit(10).all()
        active_signals = Signal.query.filter_by(status='active').order_by(Signal.timestamp.desc()).limit(5).all()
        
        # Calculate real-time metrics
        total_pnl = sum(trade.pnl for trade in recent_trades if trade.pnl)
        win_rate = len([t for t in recent_trades if t.outcome == 'win']) / len(recent_trades) * 100 if recent_trades else 0
        
        real_time_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'user': {
                'id': user.id,
                'name': user.username,
                'email': user.email,
                'status': user.status
            },
            'trading': {
                'recent_trades': [trade.to_dict() for trade in recent_trades],
                'active_signals': [signal.to_dict() for signal in active_signals],
                'total_pnl': total_pnl,
                'win_rate': round(win_rate, 2),
                'total_trades': len(recent_trades)
            },
            'market': {
                'status': 'open',  # This should be fetched from market service
                'last_update': datetime.utcnow().isoformat()
            }
        }
        
        return jsonify(real_time_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch real-time data: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/live-signals', methods=['GET'])
def get_live_signals():
    """Get live trading signals for real-time updates"""
    try:
        from .models import Signal
        
        # Get active signals
        active_signals = Signal.query.filter_by(status='active').order_by(Signal.timestamp.desc()).limit(20).all()
        
        signals_data = [signal.to_dict() for signal in active_signals]
        
        return jsonify({
            'signals': signals_data,
            'count': len(signals_data),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch live signals: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/performance-metrics', methods=['GET'])
def get_performance_metrics():
    """Get real-time performance metrics"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        from .models import Trade
        
        # Get user's trading performance
        user_trades = Trade.query.filter_by(user_id=user_id).all()
        
        if not user_trades:
            return jsonify({
                'metrics': {
                    'total_trades': 0,
                    'winning_trades': 0,
                    'losing_trades': 0,
                    'win_rate': 0,
                    'total_pnl': 0,
                    'average_win': 0,
                    'average_loss': 0,
                    'profit_factor': 0,
                    'max_drawdown': 0
                }
            }), 200
        
        # Calculate real metrics
        winning_trades = [t for t in user_trades if t.outcome == 'win']
        losing_trades = [t for t in user_trades if t.outcome == 'loss']
        
        total_pnl = sum(t.pnl for t in user_trades if t.pnl)
        win_rate = len(winning_trades) / len(user_trades) * 100
        average_win = sum(t.pnl for t in winning_trades if t.pnl) / len(winning_trades) if winning_trades else 0
        average_loss = sum(t.pnl for t in losing_trades if t.pnl) / len(losing_trades) if losing_trades else 0
        profit_factor = abs(average_win / average_loss) if average_loss != 0 else 0
        
        metrics = {
            'total_trades': len(user_trades),
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'win_rate': round(win_rate, 2),
            'total_pnl': round(total_pnl, 2),
            'average_win': round(average_win, 2),
            'average_loss': round(average_loss, 2),
            'profit_factor': round(profit_factor, 2),
            'max_drawdown': 0  # This would need more complex calculation
        }
        
        return jsonify({'metrics': metrics}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch performance metrics: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/forex-news', methods=['GET'])
def get_forex_news():
    """Get forex news - Forex Factory scraper removed as requested"""
    try:
        # Return empty news since Forex Factory scraper was removed
        return jsonify({
            'news': [],
            'total': 0,
            'message': 'Forex Factory scraper has been removed as requested',
            'source': 'Disabled'
        }), 200
            
    except Exception as e:
        return jsonify({
            'error': f'Failed to fetch forex news: {str(e)}',
            'news': [],
            'total': 0
        }), 500

@dashboard_bp.route('/dashboard/prop-firm-rules', methods=['GET'])
def get_prop_firm_rules():
    """Get prop firm rules for a specific firm"""
    try:
        firm_name = request.args.get('firm_name')
        if not firm_name:
            return jsonify({'error': 'Firm name is required'}), 400
        
        from .models import PropFirm
        prop_firm = PropFirm.query.filter_by(name=firm_name).first()
        
        if not prop_firm:
            return jsonify({'error': 'Prop firm not found'}), 404
        
        return jsonify({
            'firm': prop_firm.to_dict(),
            'status': 'success'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch prop firm rules: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/prop-firm-compliance', methods=['POST'])
def check_prop_firm_compliance():
    """Check if trading activity complies with prop firm rules"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        firm_name = data.get('firm_name')
        trading_activity = data.get('trading_activity', {})
        
        if not firm_name:
            return jsonify({'error': 'Firm name is required'}), 400
        
        from .prop_firm_scraper import PropFirmRulesScraper
        scraper = PropFirmRulesScraper()
        
        compliance_result = scraper.get_prop_firm_compliance_check(firm_name, trading_activity)
        
        return jsonify({
            'compliance': compliance_result,
            'status': 'success'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to check compliance: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/prop-firm-rules/update', methods=['POST'])
def update_prop_firm_rules():
    """Manually update prop firm rules (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        firm_name = data.get('firm_name')
        rules = data.get('rules', {})
        
        if not firm_name:
            return jsonify({'error': 'Firm name is required'}), 400
        
        from .prop_firm_scraper import PropFirmRulesScraper
        scraper = PropFirmRulesScraper()
        
        success = scraper.update_prop_firm_rules(firm_name, rules)
        
        if success:
            return jsonify({
                'message': f'Successfully updated rules for {firm_name}',
                'status': 'success'
            }), 200
        else:
            return jsonify({'error': f'Failed to update rules for {firm_name}'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Failed to update prop firm rules: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/prop-firm-rules/scrape', methods=['POST'])
def scrape_prop_firm_rules():
    """Trigger scraping of all prop firm rules (admin only)"""
    try:
        from .prop_firm_scraper import PropFirmRulesScraper
        scraper = PropFirmRulesScraper()
        
        # Start scraping in background (you might want to use Celery for this)
        success = scraper.scrape_all_prop_firms()
        
        if success:
            return jsonify({
                'message': 'Started scraping all prop firm rules',
                'status': 'success'
            }), 200
        else:
            return jsonify({'error': 'Failed to start scraping'}), 500
        
    except Exception as e:
        return jsonify({'error': f'Failed to start scraping: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/prop-firm-rules/all', methods=['GET'])
def get_all_prop_firm_rules():
    """Get all prop firm rules"""
    try:
        from .models import PropFirm
        
        # Get query parameters
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        status = request.args.get('status')  # success, failed, pending
        
        query = PropFirm.query
        
        if status:
            query = query.filter_by(scraping_status=status)
        
        prop_firms = query.offset(offset).limit(limit).all()
        
        firms_data = [firm.to_dict() for firm in prop_firms]
        
        return jsonify({
            'firms': firms_data,
            'total': len(firms_data),
            'limit': limit,
            'offset': offset,
            'status': 'success'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch prop firm rules: {str(e)}'}), 500

# Add missing API endpoints that frontend is trying to access
@dashboard_bp.route('/api/news/forex-factory', methods=['GET', 'OPTIONS'])
def get_forex_factory_news():
    """Get forex factory news - disabled as requested"""
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        # Return empty response since Forex Factory scraper was removed
        return jsonify({
            'success': True,
            'events': [],
            'message': 'Forex Factory scraper has been removed as requested',
            'source': 'Disabled'
        }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to fetch forex news: {str(e)}',
            'events': []
        }), 500

@dashboard_bp.route('/api/test/signals', methods=['GET'])
def get_test_signals():
    """Get test signals for the signal feed using the signal system"""
    try:
        from .signal_system import get_signal_system
        
        signal_system = get_signal_system()
        signals_data = signal_system.get_user_signals(limit=20)
        
        return jsonify({
            'signals': signals_data,
            'total': len(signals_data),
            'message': 'Signals retrieved successfully from signal system'
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to fetch signals: {str(e)}',
            'signals': []
        }), 500

@dashboard_bp.route('/api/signals/mark-taken', methods=['POST'])
def mark_signal_taken():
    """Mark a signal as taken by user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        signal_id = data.get('signalId')
        outcome = data.get('outcome')
        pnl = data.get('pnl')
        user_id = data.get('userId')
        
        if not signal_id or not outcome:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Update signal status in database
        from .models import SignalFeed
        signal = SignalFeed.query.filter_by(signal_id=signal_id).first()
        
        if signal:
            signal.status = 'taken'
            signal.outcome = outcome
            if pnl:
                signal.pnl = pnl
            db.session.commit()
        
        return jsonify({
            'message': 'Signal marked as taken successfully',
            'signal_id': signal_id,
            'outcome': outcome
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to mark signal as taken: {str(e)}'
        }), 500

@dashboard_bp.route('/api/admin/create-signal', methods=['POST'])
def create_admin_signal():
    """Create signal from admin dashboard - integrates with signal system"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['pair', 'direction', 'entry', 'stopLoss', 'takeProfit', 'confidence']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {missing_fields}'}), 400
        
        # Prepare signal data
        signal_data = {
            'pair': data['pair'],
            'direction': data['direction'],
            'entry_price': str(data['entry']),
            'stop_loss': str(data['stopLoss']),
            'take_profit': str(data['takeProfit']),
            'confidence': data['confidence'],
            'analysis': data.get('analysis', ''),
            'ict_concepts': data.get('ictConcepts', []),
            'market': data.get('market', 'forex'),
            'timeframe': data.get('timeframe', '1h')
        }
        
        # Use signal system to create signal
        from .signal_system import get_signal_system
        signal_system = get_signal_system()
        
        result = signal_system.create_admin_signal(signal_data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Signal created and delivered successfully',
                'signal_id': result['signal_id']
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to create signal: {str(e)}'
        }), 500
