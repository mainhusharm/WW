
from .extensions import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(50))
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    last_login = db.Column(db.DateTime)
    subscription_status = db.Column(db.String(50), default='inactive')
    subscription_start_date = db.Column(db.DateTime)
    subscription_end_date = db.Column(db.DateTime)
    trades_per_day = db.Column(db.String(20))
    trading_session = db.Column(db.String(50))
    crypto_assets = db.Column(db.JSON)
    forex_assets = db.Column(db.JSON)
    prop_firm = db.Column(db.String(255))
    account_type = db.Column(db.String(100))
    account_size = db.Column(db.Numeric(15, 2))
    risk_percentage = db.Column(db.Numeric(5, 2))
    risk_reward_ratio = db.Column(db.String(10))
    account_equity = db.Column(db.Numeric(15, 2), default=0)
    win_rate = db.Column(db.Numeric(5, 2), default=0)
    pnl = db.Column(db.Numeric(15, 2), default=0)
    questionnaire_completed = db.Column(db.Boolean, default=False) # Add this line

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    transaction_id = db.Column(db.String(255), unique=True, nullable=False)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    payment_id = db.Column(UUID(as_uuid=True), db.ForeignKey('payments.id'), nullable=False)
    plan_name = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class JournalEntry(db.Model):
    __tablename__ = 'journal_entries'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    entry_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class AiNexusChat(db.Model):
    __tablename__ = 'ai_nexus_chats'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class SupportMessage(db.Model):
    __tablename__ = 'support_messages'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='open')
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

class SignalTracking(db.Model):
    __tablename__ = 'signal_tracking'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    signal_id = db.Column(db.String(255), nullable=False)
    outcome = db.Column(db.String(20))
    pnl = db.Column(db.Numeric(15, 2))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
