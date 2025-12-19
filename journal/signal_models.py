"""
Signal Models for Real-time Signal Pipeline
Defines SQLAlchemy models for the signal system
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import func, text
import uuid

db = SQLAlchemy()

class Signal(db.Model):
    """Core signals table - immutable by users"""
    __tablename__ = 'signals'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = db.Column(db.String(50), nullable=False)
    side = db.Column(db.String(10), nullable=False)  # buy/sell
    entry_price = db.Column(db.Numeric(20, 8), nullable=True)
    stop_loss = db.Column(db.Numeric(20, 8), nullable=True)
    take_profit = db.Column(db.Numeric(20, 8), nullable=True)
    rr_ratio = db.Column(db.Numeric(10, 4), nullable=True)  # risk:reward ratio
    risk_tier = db.Column(db.String(20), nullable=False)  # low/medium/high
    payload = db.Column(JSONB, nullable=False, default={})
    created_by = db.Column(UUID(as_uuid=True), nullable=False)
    origin = db.Column(db.String(20), nullable=False, default='admin')
    status = db.Column(db.String(20), nullable=False, default='active')
    immutable = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relationships
    user_signals = db.relationship('UserSignal', backref='signal', lazy='dynamic', cascade='all, delete-orphan')
    risk_mappings = db.relationship('SignalRiskMap', backref='signal', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Signal {self.id}: {self.symbol} {self.side}>'
    
    def to_dict(self):
        """Convert signal to dictionary for JSON serialization"""
        return {
            'id': str(self.id),
            'symbol': self.symbol,
            'side': self.side,
            'entry_price': float(self.entry_price) if self.entry_price else None,
            'stop_loss': float(self.stop_loss) if self.stop_loss else None,
            'take_profit': float(self.take_profit) if self.take_profit else None,
            'rr_ratio': float(self.rr_ratio) if self.rr_ratio else None,
            'risk_tier': self.risk_tier,
            'payload': self.payload,
            'created_by': str(self.created_by),
            'origin': self.origin,
            'status': self.status,
            'immutable': self.immutable,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def create_signal(cls, symbol: str, side: str, entry_price: float, 
                     stop_loss: float, take_profit: float, risk_tier: str,
                     payload: dict, created_by: str) -> 'Signal':
        """
        Create a new signal with computed risk:reward ratio
        
        Args:
            symbol: Trading symbol (e.g., BTCUSD, EURUSD)
            side: buy or sell
            entry_price: Entry price
            stop_loss: Stop loss price
            take_profit: Take profit price
            risk_tier: Risk tier (low/medium/high)
            payload: Additional metadata
            created_by: Admin user ID
            
        Returns:
            Created Signal instance
        """
        # Calculate risk:reward ratio
        rr_ratio = None
        if entry_price and stop_loss and take_profit:
            if side.lower() == 'buy':
                risk = abs(entry_price - stop_loss)
                reward = abs(take_profit - entry_price)
            else:  # sell
                risk = abs(stop_loss - entry_price)
                reward = abs(entry_price - take_profit)
            
            if risk > 0:
                rr_ratio = reward / risk
        
        signal = cls(
            symbol=symbol,
            side=side.upper(),
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            rr_ratio=rr_ratio,
            risk_tier=risk_tier.lower(),
            payload=payload,
            created_by=created_by,
            origin='admin',
            status='active',
            immutable=True
        )
        
        return signal
    
    @classmethod
    def get_active_signals_by_risk_tier(cls, risk_tier: str, limit: int = 100):
        """
        Get active signals for a specific risk tier
        
        Args:
            risk_tier: Risk tier to filter by
            limit: Maximum number of signals to return
            
        Returns:
            Query object for active signals
        """
        return cls.query.filter(
            cls.risk_tier == risk_tier.lower(),
            cls.status == 'active',
            cls.origin == 'admin'
        ).order_by(cls.created_at.desc()).limit(limit)
    
    @classmethod
    def get_signals_for_user(cls, user_id: str, risk_tier: str, limit: int = 100):
        """
        Get signals for a specific user based on their risk tier
        
        Args:
            user_id: User ID
            risk_tier: User's risk tier
            limit: Maximum number of signals to return
            
        Returns:
            List of signals
        """
        return cls.query.filter(
            cls.risk_tier == risk_tier.lower(),
            cls.status == 'active',
            cls.origin == 'admin'
        ).order_by(cls.created_at.desc()).limit(limit).all()

class UserSignal(db.Model):
    """Tracks which users received which signals"""
    __tablename__ = 'user_signals'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.uuid'), nullable=False)
    signal_id = db.Column(UUID(as_uuid=True), db.ForeignKey('signals.id'), nullable=False)
    delivered = db.Column(db.Boolean, default=False)
    delivered_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=func.now())
    
    # Unique constraint to prevent duplicate user-signal pairs
    __table_args__ = (db.UniqueConstraint('user_id', 'signal_id', name='unique_user_signal'),)
    
    def __repr__(self):
        return f'<UserSignal {self.user_id}:{self.signal_id}>'
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'signal_id': str(self.signal_id),
            'delivered': self.delivered,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def mark_delivered(cls, user_id: str, signal_id: str):
        """
        Mark signal as delivered to user
        
        Args:
            user_id: User ID
            signal_id: Signal ID
        """
        user_signal = cls.query.filter_by(
            user_id=user_id,
            signal_id=signal_id
        ).first()
        
        if user_signal:
            user_signal.delivered = True
            user_signal.delivered_at = func.now()
            db.session.commit()
    
    @classmethod
    def create_user_signal_mapping(cls, user_id: str, signal_id: str):
        """
        Create user-signal mapping
        
        Args:
            user_id: User ID
            signal_id: Signal ID
        """
        # Check if mapping already exists
        existing = cls.query.filter_by(
            user_id=user_id,
            signal_id=signal_id
        ).first()
        
        if not existing:
            user_signal = cls(
                user_id=user_id,
                signal_id=signal_id,
                delivered=False
            )
            db.session.add(user_signal)
            db.session.commit()
            return user_signal
        
        return existing

class SignalRiskMap(db.Model):
    """Maps signals to risk tiers for efficient querying"""
    __tablename__ = 'signal_risk_map'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    signal_id = db.Column(UUID(as_uuid=True), db.ForeignKey('signals.id'), nullable=False)
    risk_tier = db.Column(db.String(20), nullable=False)
    
    def __repr__(self):
        return f'<SignalRiskMap {self.signal_id}:{self.risk_tier}>'
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': str(self.id),
            'signal_id': str(self.signal_id),
            'risk_tier': self.risk_tier
        }
