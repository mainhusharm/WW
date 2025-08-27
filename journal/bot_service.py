import threading
import time
import logging
import requests
import json
from datetime import datetime, timedelta
from decimal import Decimal
from .models import BotStatus, BotData, OHLCData, db
from .extensions import db
import yfinance as yf
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BotService:
    def __init__(self):
        self.running = False
        self.threads = {}
        self.base_url = os.getenv('BASE_URL', 'http://localhost:5000')
        
    def start_bot(self, bot_type):
        """Start a specific bot in a separate thread"""
        if bot_type in self.threads and self.threads[bot_type].is_alive():
            logger.info(f"Bot {bot_type} is already running")
            return False
            
        self.threads[bot_type] = threading.Thread(target=self._run_bot, args=(bot_type,))
        self.threads[bot_type].daemon = True
        self.threads[bot_type].start()
        
        logger.info(f"Bot {bot_type} started successfully")
        return True
        
    def stop_bot(self, bot_type):
        """Stop a specific bot"""
        if bot_type in self.threads and self.threads[bot_type].is_alive():
            self.running = False
            self.threads[bot_type].join(timeout=5)
            logger.info(f"Bot {bot_type} stopped successfully")
            return True
        return False
        
    def _run_bot(self, bot_type):
        """Main bot loop"""
        self.running = True
        
        if bot_type == 'crypto':
            self._run_crypto_bot()
        elif bot_type == 'forex':
            self._run_forex_bot()
        else:
            logger.error(f"Unknown bot type: {bot_type}")
            
    def _run_crypto_bot(self):
        """Crypto bot implementation"""
        crypto_pairs = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOT-USD']
        
        while self.running:
            try:
                for pair in crypto_pairs:
                    if not self.running:
                        break
                        
                    # Fetch data from yfinance
                    ticker = yf.Ticker(pair)
                    hist = ticker.history(period='1d', interval='1m')
                    
                    if not hist.empty:
                        latest = hist.iloc[-1]
                        
                        # Store data
                        self._store_bot_data(
                            bot_type='crypto',
                            pair=pair,
                            price=float(latest['Close']),
                            volume=float(latest['Volume']),
                            high=float(latest['High']),
                            low=float(latest['Low']),
                            open_price=float(latest['Open']),
                            close_price=float(latest['Close']),
                            timeframe='1m'
                        )
                        
                        logger.info(f"Crypto data stored for {pair}: ${latest['Close']:.2f}")
                    
                    time.sleep(1)  # Small delay between pairs
                    
                # Wait before next cycle
                time.sleep(60)  # 1 minute cycle
                
            except Exception as e:
                logger.error(f"Error in crypto bot: {str(e)}")
                time.sleep(30)  # Wait before retry
                
    def _run_forex_bot(self):
        """Forex bot implementation"""
        forex_pairs = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X']
        
        while self.running:
            try:
                for pair in forex_pairs:
                    if not self.running:
                        break
                        
                    # Fetch data from yfinance
                    ticker = yf.Ticker(pair)
                    hist = ticker.history(period='1d', interval='1m')
                    
                    if not hist.empty:
                        latest = hist.iloc[-1]
                        
                        # Store data
                        self._store_bot_data(
                            bot_type='forex',
                            pair=pair.replace('=X', ''),
                            price=float(latest['Close']),
                            volume=float(latest['Volume']),
                            high=float(latest['High']),
                            low=float(latest['Low']),
                            open_price=float(latest['Open']),
                            close_price=float(latest['Close']),
                            timeframe='1m'
                        )
                        
                        logger.info(f"Forex data stored for {pair}: {latest['Close']:.5f}")
                    
                    time.sleep(1)  # Small delay between pairs
                    
                # Wait before next cycle
                time.sleep(60)  # 1 minute cycle
                
            except Exception as e:
                logger.error(f"Error in forex bot: {str(e)}")
                time.sleep(30)  # Wait before retry
                
    def _store_bot_data(self, **kwargs):
        """Store bot data in database"""
        try:
            # Create new bot data entry
            bot_data = BotData(
                bot_type=kwargs['bot_type'],
                pair=kwargs['pair'],
                timestamp=datetime.utcnow(),
                price=Decimal(str(kwargs['price'])),
                signal_type=kwargs.get('signal_type', 'neutral'),
                signal_strength=Decimal(str(kwargs['signal_strength'])) if kwargs.get('signal_strength') else None,
                is_recommended=kwargs.get('is_recommended', False),
                volume=Decimal(str(kwargs['volume'])) if kwargs.get('volume') else None,
                high=Decimal(str(kwargs['high'])) if kwargs.get('high') else None,
                low=Decimal(str(kwargs['low'])) if kwargs.get('low') else None,
                open_price=Decimal(str(kwargs['open_price'])) if kwargs.get('open_price') else None,
                close_price=Decimal(str(kwargs['close_price'])) if kwargs.get('close_price') else None,
                timeframe=kwargs.get('timeframe', '1m')
            )
            
            db.session.add(bot_data)
            db.session.commit()
            
            # Also store OHLC data if available
            if all(key in kwargs for key in ['open_price', 'high', 'low', 'close_price', 'timeframe']):
                ohlc_data = OHLCData(
                    pair=kwargs['pair'],
                    timeframe=kwargs['timeframe'],
                    timestamp=datetime.utcnow(),
                    open_price=Decimal(str(kwargs['open_price'])),
                    high_price=Decimal(str(kwargs['high'])),
                    low_price=Decimal(str(kwargs['low'])),
                    close_price=Decimal(str(kwargs['close_price'])),
                    volume=Decimal(str(kwargs['volume'])) if kwargs.get('volume') else None
                )
                db.session.add(ohlc_data)
                db.session.commit()
                
        except Exception as e:
            logger.error(f"Error storing bot data: {str(e)}")
            db.session.rollback()
            
    def check_bot_status(self):
        """Check database for bot status and start/stop accordingly"""
        try:
            bots = BotStatus.query.all()
            
            for bot in bots:
                if bot.is_active and bot.bot_type not in self.threads:
                    # Bot should be running but isn't
                    logger.info(f"Starting bot {bot.bot_type} based on database status")
                    self.start_bot(bot.bot_type)
                elif not bot.is_active and bot.bot_type in self.threads:
                    # Bot should be stopped but is running
                    logger.info(f"Stopping bot {bot.bot_type} based on database status")
                    self.stop_bot(bot.bot_type)
                    
        except Exception as e:
            logger.error(f"Error checking bot status: {str(e)}")
            
    def start_all_active_bots(self):
        """Start all bots that are marked as active in the database"""
        try:
            active_bots = BotStatus.query.filter_by(is_active=True).all()
            
            for bot in active_bots:
                if bot.bot_type not in self.threads:
                    logger.info(f"Starting active bot: {bot.bot_type}")
                    self.start_bot(bot.bot_type)
                    
        except Exception as e:
            logger.error(f"Error starting active bots: {str(e)}")
            
    def stop_all_bots(self):
        """Stop all running bots"""
        for bot_type in list(self.threads.keys()):
            self.stop_bot(bot_type)
            
    def get_status(self):
        """Get current status of all bots"""
        status = {}
        
        for bot_type, thread in self.threads.items():
            status[bot_type] = {
                'running': thread.is_alive(),
                'thread_id': thread.ident
            }
            
        return status

# Global bot service instance
bot_service = BotService()

def start_bot_service():
    """Start the bot service"""
    try:
        # Initialize bot status in database if not exists
        with db.app.app_context():
            crypto_bot = BotStatus.query.filter_by(bot_type='crypto').first()
            if not crypto_bot:
                crypto_bot = BotStatus(bot_type='crypto', is_active=False)
                db.session.add(crypto_bot)
                
            forex_bot = BotStatus.query.filter_by(bot_type='forex').first()
            if not forex_bot:
                forex_bot = BotStatus(bot_type='forex', is_active=False)
                db.session.add(forex_bot)
                
            db.session.commit()
            
        # Start all active bots
        bot_service.start_all_active_bots()
        
        # Start status checker thread
        def status_checker():
            while True:
                try:
                    bot_service.check_bot_status()
                    time.sleep(30)  # Check every 30 seconds
                except Exception as e:
                    logger.error(f"Error in status checker: {str(e)}")
                    time.sleep(60)
                    
        status_thread = threading.Thread(target=status_checker)
        status_thread.daemon = True
        status_thread.start()
        
        logger.info("Bot service started successfully")
        
    except Exception as e:
        logger.error(f"Error starting bot service: {str(e)}")

def stop_bot_service():
    """Stop the bot service"""
    try:
        bot_service.stop_all_bots()
        logger.info("Bot service stopped successfully")
    except Exception as e:
        logger.error(f"Error stopping bot service: {str(e)}")
