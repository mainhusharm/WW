from .extensions import db
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlite3 import Connection as SQLite3Connection
from datetime import datetime

# Enforce foreign key constraints on SQLite
@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, SQLite3Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=True)  # UUID for signal system
    unique_id = db.Column(db.String(6), unique=True, nullable=False)  # 6-digit unique ID
    username = db.Column(db.String(80), unique=True, nullable=False)
    first_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=True)
    phone = db.Column(db.String(40), nullable=True)
    company = db.Column(db.String(120), nullable=True)
    country = db.Column(db.String(120), nullable=True)
    agree_to_marketing = db.Column(db.Boolean, default=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    normalized_email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))
    active_session_id = db.Column(db.String(255), nullable=True, unique=True)
    plan_type = db.Column(db.String(20), nullable=False, default='free') # e.g., 'free', 'premium', 'enterprise'
    risk_tier = db.Column(db.String(20), nullable=True, default='medium') # low, medium, high
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    last_login = db.Column(db.DateTime, nullable=True)
    consent_accepted = db.Column(db.Boolean, nullable=False, default=False)
    consent_timestamp = db.Column(db.DateTime, nullable=True)
    account_screenshot_url = db.Column(db.String(255), nullable=True)
    reset_token = db.Column(db.String(100), nullable=True, unique=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    trades = db.relationship('Trade', backref='user', lazy=True)
    accounts = db.relationship('Account', backref='user', lazy=True)
    risk_plan = db.relationship('RiskPlan', backref='user', uselist=False)
    user_activities = db.relationship('UserActivity', backref='user', lazy=True)
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if not self.unique_id:
            self.unique_id = self.generate_unique_id()
        
        # Generate UUID if not provided
        if not self.uuid:
            import uuid
            self.uuid = str(uuid.uuid4())
        
        # Auto-normalize email if provided
        if self.email and not self.normalized_email:
            self.normalized_email = self.normalize_email(self.email)
    
    @staticmethod
    def normalize_email(email):
        """
        Normalize email to prevent duplicates:
        - Convert to lowercase
        - Remove dots from Gmail addresses
        - Remove everything after + in Gmail addresses
        """
        if not email:
            return email
        
        email = email.lower().strip()
        
        # Split email into local and domain parts
        if '@' not in email:
            return email
        
        local_part, domain = email.split('@', 1)
        
        # Special handling for Gmail
        if domain == 'gmail.com':
            # Remove dots
            local_part = local_part.replace('.', '')
            # Remove everything after +
            local_part = local_part.split('+')[0]
        
        return f"{local_part}@{domain}"
    
    @staticmethod
    def generate_unique_id():
        import random
        import string
        while True:
            unique_id = ''.join(random.choices(string.digits, k=6))
            if not User.query.filter_by(unique_id=unique_id).first():
                return unique_id

class Trade(db.Model):
    __tablename__ = 'trades'
    id = db.Column(db.Integer, primary_key=True)
    signal_id = db.Column(db.Integer, unique=True, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    asset = db.Column(db.String(50), nullable=False)
    direction = db.Column(db.String(4), nullable=False)  # 'buy' or 'sell'
    entry_price = db.Column(db.Float, nullable=False)
    exit_price = db.Column(db.Float, nullable=False)
    sl = db.Column(db.Float, nullable=True)  # Stop Loss
    tp = db.Column(db.Float, nullable=True)  # Take Profit
    lot_size = db.Column(db.Float, nullable=False)
    trade_duration = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    outcome = db.Column(db.String(10), nullable=False)  # 'win', 'loss', or 'skipped'
    status = db.Column(db.String(10), nullable=False, default='active') # 'active', 'taken', 'skipped'
    strategy_tag = db.Column(db.String(100), nullable=True)
    screenshot_url = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f'<Trade {self.id} on {self.asset}>'

class Account(db.Model):
    __tablename__ = 'accounts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    prop_firm_id = db.Column(db.Integer, db.ForeignKey('prop_firms.id'), nullable=True)
    account_name = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)  # e.g., 'live', 'demo', 'prop firm'
    balance = db.Column(db.Float, nullable=False, default=0.0)
    prop_firm = db.relationship('PropFirm', backref=db.backref('accounts', lazy=True))
    trades = db.relationship('Trade', backref='account', lazy=True)

    def __repr__(self):
        return f'<Account {self.account_name}>'

class PropFirm(db.Model):
    __tablename__ = 'prop_firms'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    website = db.Column(db.String(255), nullable=True)
    
    # Enhanced prop firm rules fields
    hft_allowed = db.Column(db.Boolean, nullable=True)  # HFT (high frequency trading) allowed
    hft_min_hold_time = db.Column(db.Integer, nullable=True)  # Minimum hold time in seconds (e.g., 60)
    hft_max_trades_per_day = db.Column(db.Integer, nullable=True)  # Maximum HFT trades per day
    
    martingale_allowed = db.Column(db.Boolean, nullable=True)  # Martingale strategy allowed
    martingale_max_positions = db.Column(db.Integer, nullable=True)  # Maximum positions for martingale
    
    max_lot_size = db.Column(db.Float, nullable=True)  # Maximum lot size allowed
    max_risk_per_trade = db.Column(db.Float, nullable=True)  # Maximum risk per trade in percentage
    
    reverse_trading_allowed = db.Column(db.Boolean, nullable=True)  # Reverse trading allowed
    reverse_trading_cooldown = db.Column(db.Integer, nullable=True)  # Cooldown period in minutes
    
    # Real-time tracking fields
    last_updated = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    last_scraped = db.Column(db.DateTime, nullable=True)
    scraping_status = db.Column(db.String(50), nullable=True)  # success, failed, pending
    scraping_error = db.Column(db.Text, nullable=True)
    
    # Additional compliance fields
    daily_loss_limit = db.Column(db.Float, nullable=True)
    max_drawdown = db.Column(db.Float, nullable=True)
    profit_target_phase1 = db.Column(db.Float, nullable=True)
    profit_target_phase2 = db.Column(db.Float, nullable=True)
    min_trading_days = db.Column(db.Integer, nullable=True)
    consistency_rule = db.Column(db.Float, nullable=True)
    leverage_forex = db.Column(db.Integer, nullable=True)
    leverage_metals = db.Column(db.Integer, nullable=True)
    leverage_crypto = db.Column(db.Integer, nullable=True)
    news_trading = db.Column(db.String(50), nullable=True)  # allowed, restricted, forbidden
    weekend_holding = db.Column(db.String(50), nullable=True)  # allowed, not_allowed, allowed_with_fees
    
    # Rules source tracking
    rules_source_url = db.Column(db.String(500), nullable=True)
    rules_last_verified = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'website': self.website,
            'hft_allowed': self.hft_allowed,
            'hft_min_hold_time': self.hft_min_hold_time,
            'hft_max_trades_per_day': self.hft_max_trades_per_day,
            'martingale_allowed': self.martingale_allowed,
            'martingale_max_positions': self.martingale_max_positions,
            'max_lot_size': self.max_lot_size,
            'max_risk_per_trade': self.max_risk_per_trade,
            'reverse_trading_allowed': self.reverse_trading_allowed,
            'reverse_trading_cooldown': self.reverse_trading_cooldown,
            'daily_loss_limit': self.daily_loss_limit,
            'max_drawdown': self.max_drawdown,
            'profit_target_phase1': self.profit_target_phase1,
            'profit_target_phase2': self.profit_target_phase2,
            'min_trading_days': self.min_trading_days,
            'consistency_rule': self.consistency_rule,
            'leverage': {
                'forex': self.leverage_forex,
                'metals': self.leverage_metals,
                'crypto': self.leverage_crypto
            },
            'news_trading': self.news_trading,
            'weekend_holding': self.weekend_holding,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'last_scraped': self.last_scraped.isoformat() if self.last_scraped else None,
            'scraping_status': self.scraping_status,
            'rules_source_url': self.rules_source_url,
            'rules_last_verified': self.rules_last_verified.isoformat() if self.rules_last_verified else None
        }

    def __repr__(self):
        return f'<PropFirm {self.name}>'

class Performance(db.Model):
    __tablename__ = 'performance'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    total_trades = db.Column(db.Integer, nullable=False, default=0)
    winning_trades = db.Column(db.Integer, nullable=False, default=0)
    losing_trades = db.Column(db.Integer, nullable=False, default=0)
    skipped_trades = db.Column(db.Integer, nullable=False, default=0)
    win_rate = db.Column(db.Float, nullable=False, default=0.0)
    total_pnl = db.Column(db.Float, nullable=False, default=0.0)
    user = db.relationship('User', backref=db.backref('performance_records', lazy=True))
    account = db.relationship('Account', backref=db.backref('performance_records', lazy=True))

    def __repr__(self):
        return f'<Performance for User {self.user_id} on {self.date}>'

class Signal(db.Model):
    __tablename__ = 'signals'
    id = db.Column(db.Integer, primary_key=True)
    signal_id = db.Column(db.String(100), unique=True, nullable=False)
    pair = db.Column(db.String(20), nullable=False)  # Currency pair like EURUSD
    timeframe = db.Column(db.String(10), nullable=False)  # 15m, 1h, 4h, etc.
    direction = db.Column(db.String(10), nullable=False)  # BUY or SELL
    entry_price = db.Column(db.String(20), nullable=False)
    stop_loss = db.Column(db.String(20), nullable=False)
    take_profit = db.Column(db.Text, nullable=False)  # Can be comma-separated values
    confidence = db.Column(db.Integer, nullable=False, default=90)
    analysis = db.Column(db.Text, nullable=True)
    ict_concepts = db.Column(db.Text, nullable=True)  # JSON string of ICT concepts
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    status = db.Column(db.String(20), nullable=False, default='active')  # active, expired, hit
    created_by = db.Column(db.String(50), nullable=False, default='admin')
    
    def to_dict(self):
        return {
            'id': self.signal_id,
            'pair': self.pair,
            'timeframe': self.timeframe,
            'type': self.direction.lower(),
            'entry': self.entry_price,
            'stopLoss': self.stop_loss,
            'takeProfit': self.take_profit.split(',') if ',' in self.take_profit else [self.take_profit],
            'confidence': self.confidence,
            'analysis': self.analysis,
            'ictConcepts': self.ict_concepts.split(',') if self.ict_concepts else [],
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'status': self.status
        }

    def __repr__(self):
        return f'<Signal {self.signal_id} - {self.pair} {self.direction}>'

class SignalFeed(db.Model):
    __tablename__ = 'signal_feed'
    id = db.Column(db.Integer, primary_key=True)
    unique_key = db.Column(db.String(64), unique=True, nullable=False)  # Deduplication key
    signal_id = db.Column(db.String(100), nullable=False)
    pair = db.Column(db.String(20), nullable=False)
    direction = db.Column(db.String(10), nullable=False)  # LONG, SHORT
    entry_price = db.Column(db.String(20), nullable=False)
    stop_loss = db.Column(db.String(20), nullable=False)
    take_profit = db.Column(db.Text, nullable=False)  # JSON array or string
    confidence = db.Column(db.Integer, nullable=False, default=90)
    analysis = db.Column(db.Text, nullable=True)
    ict_concepts = db.Column(db.Text, nullable=True)  # JSON array
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    status = db.Column(db.String(20), nullable=False, default='active')  # active, taken, expired
    market = db.Column(db.String(10), nullable=False, default='forex')  # forex, crypto
    timeframe = db.Column(db.String(10), nullable=True)
    created_by = db.Column(db.String(50), nullable=False, default='admin')
    
    # User interaction fields
    outcome = db.Column(db.String(20), nullable=True)  # Target Hit, Stop Loss Hit, Breakeven
    pnl = db.Column(db.Float, nullable=True)
    taken_by = db.Column(db.String(50), nullable=True)
    taken_at = db.Column(db.DateTime, nullable=True)
    
    # Recommended signal field
    is_recommended = db.Column(db.Boolean, nullable=False, default=False)
    
    def to_dict(self):
        return {
            'id': self.signal_id,
            'pair': self.pair,
            'direction': self.direction,
            'entry': self.entry_price,
            'stopLoss': self.stop_loss,
            'takeProfit': self.take_profit,
            'confidence': self.confidence,
            'analysis': self.analysis,
            'ictConcepts': self.ict_concepts,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'status': self.status,
            'market': self.market,
            'timeframe': self.timeframe,
            'outcome': self.outcome,
            'pnl': self.pnl,
            'is_recommended': self.is_recommended
        }

    def __repr__(self):
        return f'<SignalFeed {self.signal_id} - {self.pair} {self.direction}>'

class UserProgress(db.Model):
    __tablename__ = 'user_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    progress_data = db.Column(db.Text, nullable=True) # Using Text for JSON
    questionnaire_answers = db.Column(db.Text, nullable=True) # Using Text for JSON
    trading_data = db.Column(db.Text, nullable=True) # Using Text for JSON
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

class RiskPlan(db.Model):
    __tablename__ = 'risk_plans'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # User Profile
    initial_balance = db.Column(db.Float)
    account_equity = db.Column(db.Float)
    trades_per_day = db.Column(db.String)
    trading_session = db.Column(db.String)
    crypto_assets = db.Column(db.Text)
    forex_assets = db.Column(db.Text)
    has_account = db.Column(db.String)
    experience = db.Column(db.String)
    prop_firm = db.Column(db.String)
    account_type = db.Column(db.String)
    account_size = db.Column(db.Float)
    risk_percentage = db.Column(db.Float)

    # Risk Parameters
    max_daily_risk = db.Column(db.Float)
    max_daily_risk_pct = db.Column(db.String)
    base_trade_risk = db.Column(db.Float)
    base_trade_risk_pct = db.Column(db.String)
    min_risk_reward = db.Column(db.String)

    # Trades
    trades = db.Column(db.Text)

    # Prop Firm Compliance
    prop_firm_compliance = db.Column(db.Text)

    def __repr__(self):
        return f'<RiskPlan for User {self.user_id}>'

class UserActivity(db.Model):
    __tablename__ = 'user_activities'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # 'login', 'signal_taken', 'settings_changed', etc.
    activity_data = db.Column(db.Text, nullable=True)  # JSON string with activity details
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    ip_address = db.Column(db.String(45), nullable=True)  # IPv4 or IPv6
    user_agent = db.Column(db.Text, nullable=True)
    
    def __repr__(self):
        return f'<UserActivity {self.activity_type} for User {self.user_id}>'

class BotData(db.Model):
    """Stores all raw + processed data from Crypto Bot & Forex Data Bot"""
    __tablename__ = 'bot_data'
    id = db.Column(db.Integer, primary_key=True)
    bot_type = db.Column(db.String(20), nullable=False)  # 'crypto' or 'forex'
    pair = db.Column(db.String(20), nullable=False)  # e.g., BTC/USDT, EUR/USD
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    price = db.Column(db.Numeric(20, 8), nullable=False)  # last fetched price
    signal_type = db.Column(db.String(10), nullable=True)  # 'buy', 'sell', 'neutral'
    signal_strength = db.Column(db.Numeric(5, 2), nullable=True)  # numeric or % if available
    is_recommended = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    
    # Additional fields for comprehensive data storage
    volume = db.Column(db.Numeric(20, 8), nullable=True)
    high = db.Column(db.Numeric(20, 8), nullable=True)
    low = db.Column(db.Numeric(20, 8), nullable=True)
    open_price = db.Column(db.Numeric(20, 8), nullable=True)
    close_price = db.Column(db.Numeric(20, 8), nullable=True)
    timeframe = db.Column(db.String(10), nullable=True)  # 1m, 5m, 15m, 1h, etc.
    
    def __repr__(self):
        return f'<BotData {self.bot_type} - {self.pair} at {self.timestamp}>'

class UserSignal(db.Model):
    """Stores user signal history with trade outcomes"""
    __tablename__ = 'user_signals'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pair = db.Column(db.String(20), nullable=False)  # e.g., BTC/USDT
    signal_type = db.Column(db.String(10), nullable=False)  # 'buy', 'sell', 'neutral'
    result = db.Column(db.String(20), nullable=True)  # 'win', 'loss', 'skipped'
    confidence_pct = db.Column(db.Numeric(5, 2), nullable=True)  # numeric
    is_recommended = db.Column(db.Boolean, nullable=False, default=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    
    # Signal details
    entry_price = db.Column(db.Numeric(20, 8), nullable=True)
    stop_loss = db.Column(db.Numeric(20, 8), nullable=True)
    take_profit = db.Column(db.Numeric(20, 8), nullable=True)
    analysis = db.Column(db.Text, nullable=True)
    ict_concepts = db.Column(db.Text, nullable=True)  # JSON array
    
    # Trade outcome details
    pnl = db.Column(db.Numeric(20, 8), nullable=True)
    outcome_timestamp = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('user_signals', lazy=True))
    
    def __repr__(self):
        return f'<UserSignal {self.pair} {self.signal_type} for User {self.user_id}>'

class BotStatus(db.Model):
    """Manages bot active/inactive status"""
    __tablename__ = 'bot_status'
    id = db.Column(db.Integer, primary_key=True)
    bot_type = db.Column(db.String(20), nullable=False, unique=True)  # 'crypto', 'forex'
    is_active = db.Column(db.Boolean, nullable=False, default=False)
    last_started = db.Column(db.DateTime, nullable=True)
    last_stopped = db.Column(db.DateTime, nullable=True)
    status_updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_by = db.Column(db.String(50), nullable=True)  # user who changed status
    
    def __repr__(self):
        return f'<BotStatus {self.bot_type} - {"Active" if self.is_active else "Inactive"}>'

class OHLCData(db.Model):
    """Stores aggregated OHLC candle data for charting"""
    __tablename__ = 'ohlc_data'
    id = db.Column(db.Integer, primary_key=True)
    pair = db.Column(db.String(20), nullable=False)
    timeframe = db.Column(db.String(10), nullable=False)  # 1m, 5m, 15m, 1h
    timestamp = db.Column(db.DateTime, nullable=False)
    open_price = db.Column(db.Numeric(20, 8), nullable=False)
    high_price = db.Column(db.Numeric(20, 8), nullable=False)
    low_price = db.Column(db.Numeric(20, 8), nullable=False)
    close_price = db.Column(db.Numeric(20, 8), nullable=False)
    volume = db.Column(db.Numeric(20, 8), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    
    # Index for efficient querying
    __table_args__ = (
        db.Index('idx_ohlc_pair_timeframe_timestamp', 'pair', 'timeframe', 'timestamp'),
    )
    
    def __repr__(self):
        return f'<OHLCData {self.pair} {self.timeframe} at {self.timestamp}>'

class Notification(db.Model):
    """Stores system and user notifications"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='medium')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='notifications')
    
    def __repr__(self):
        return f'<Notification {self.type} for User {self.user_id}>'

class SupportTicket(db.Model):
    """Stores customer support tickets"""
    __tablename__ = 'support_tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='open')
    priority = db.Column(db.String(20), default='medium')
    assigned_to = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    customer = db.relationship('User', backref='support_tickets')
    
    def __repr__(self):
        return f'<SupportTicket {self.subject} for Customer {self.customer_id}>'
