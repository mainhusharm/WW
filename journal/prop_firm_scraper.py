import requests
import time
import json
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from .models import db, PropFirm
import logging

logger = logging.getLogger(__name__)

class PropFirmRulesScraper:
    """Real-time prop firm rules scraper and tracker"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def setup_selenium(self):
        """Setup headless Chrome for JavaScript-heavy sites"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        return webdriver.Chrome(options=chrome_options)
    
    def scrape_ftmo_rules(self):
        """Scrape FTMO rules from their website"""
        try:
            url = "https://ftmo.com/en/forex-trading-rules/"
            response = self.session.get(url, timeout=30)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            rules = {
                'hft_allowed': False,
                'hft_min_hold_time': 60,
                'hft_max_trades_per_day': 10,
                'martingale_allowed': False,
                'martingale_max_positions': 1,
                'max_lot_size': 20.0,
                'max_risk_per_trade': 5.0,
                'reverse_trading_allowed': False,
                'reverse_trading_cooldown': 60,
                'daily_loss_limit': 5.0,
                'max_drawdown': 10.0,
                'profit_target_phase1': 10.0,
                'profit_target_phase2': 5.0,
                'min_trading_days': 10,
                'consistency_rule': 30.0,
                'leverage_forex': 100,
                'leverage_metals': 100,
                'leverage_crypto': 100,
                'news_trading': 'forbidden',
                'weekend_holding': 'not_allowed',
                'rules_source_url': url,
                'rules_last_verified': datetime.utcnow()
            }
            
            # Extract specific rules from the page content
            content = soup.get_text().lower()
            
            # HFT rules
            if 'high frequency' in content or 'hft' in content:
                if 'not allowed' in content or 'prohibited' in content:
                    rules['hft_allowed'] = False
                else:
                    rules['hft_allowed'] = True
            
            # Martingale rules
            if 'martingale' in content:
                if 'not allowed' in content or 'prohibited' in content:
                    rules['martingale_allowed'] = False
                else:
                    rules['martingale_allowed'] = True
            
            # Reverse trading rules
            if 'reverse' in content and 'position' in content:
                if 'not allowed' in content or 'prohibited' in content:
                    rules['reverse_trading_allowed'] = False
                else:
                    rules['reverse_trading_allowed'] = True
            
            return rules
            
        except Exception as e:
            logger.error(f"Error scraping FTMO rules: {str(e)}")
            return None
    
    def scrape_myforexfunds_rules(self):
        """Scrape MyForexFunds rules"""
        try:
            url = "https://myforexfunds.com/trading-rules/"
            response = self.session.get(url, timeout=30)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            rules = {
                'hft_allowed': False,
                'hft_min_hold_time': 60,
                'hft_max_trades_per_day': 15,
                'martingale_allowed': False,
                'martingale_max_positions': 1,
                'max_lot_size': 15.0,
                'max_risk_per_trade': 4.0,
                'reverse_trading_allowed': False,
                'reverse_trading_cooldown': 30,
                'daily_loss_limit': 4.0,
                'max_drawdown': 8.0,
                'profit_target_phase1': 8.0,
                'profit_target_phase2': 5.0,
                'min_trading_days': 7,
                'consistency_rule': 25.0,
                'leverage_forex': 100,
                'leverage_metals': 100,
                'leverage_crypto': 100,
                'news_trading': 'restricted',
                'weekend_holding': 'allowed',
                'rules_source_url': url,
                'rules_last_verified': datetime.utcnow()
            }
            
            content = soup.get_text().lower()
            
            # Extract rules based on content
            if 'scalping' in content and 'allowed' in content:
                rules['hft_allowed'] = True
                rules['hft_min_hold_time'] = 30
            
            if 'martingale' in content and 'not allowed' in content:
                rules['martingale_allowed'] = False
            
            return rules
            
        except Exception as e:
            logger.error(f"Error scraping MyForexFunds rules: {str(e)}")
            return None
    
    def scrape_the5percenters_rules(self):
        """Scrape The5%ers rules"""
        try:
            url = "https://the5ers.com/trading-rules"
            response = self.session.get(url, timeout=30)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            rules = {
                'hft_allowed': True,
                'hft_min_hold_time': 30,
                'hft_max_trades_per_day': 20,
                'martingale_allowed': False,
                'martingale_max_positions': 1,
                'max_lot_size': 10.0,
                'max_risk_per_trade': 3.0,
                'reverse_trading_allowed': True,
                'reverse_trading_cooldown': 15,
                'daily_loss_limit': 3.0,
                'max_drawdown': 6.0,
                'profit_target_phase1': 6.0,
                'profit_target_phase2': 4.0,
                'min_trading_days': 5,
                'consistency_rule': 20.0,
                'leverage_forex': 100,
                'leverage_metals': 100,
                'leverage_crypto': 100,
                'news_trading': 'allowed',
                'weekend_holding': 'allowed',
                'rules_source_url': url,
                'rules_last_verified': datetime.utcnow()
            }
            
            content = soup.get_text().lower()
            
            # Extract rules based on content
            if 'scalping' in content and 'allowed' in content:
                rules['hft_allowed'] = True
                rules['hft_min_hold_time'] = 30
            
            return rules
            
        except Exception as e:
            logger.error(f"Error scraping The5%ers rules: {str(e)}")
            return None
    
    def scrape_quanttekel_rules(self):
        """Scrape QuantTekel rules"""
        try:
            url = "https://quanttekel.com/trading-rules"
            response = self.session.get(url, timeout=30)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            rules = {
                'hft_allowed': False,
                'hft_min_hold_time': 60,
                'hft_max_trades_per_day': 8,
                'martingale_allowed': False,
                'martingale_max_positions': 1,
                'max_lot_size': 12.0,
                'max_risk_per_trade': 4.0,
                'reverse_trading_allowed': False,
                'reverse_trading_cooldown': 120,
                'daily_loss_limit': 4.0,
                'max_drawdown': 8.0,
                'profit_target_phase1': 6.0,
                'profit_target_phase2': 5.0,
                'min_trading_days': 4,
                'consistency_rule': 30.0,
                'leverage_forex': 30,
                'leverage_metals': 15,
                'leverage_crypto': 1,
                'news_trading': 'restricted',
                'weekend_holding': 'allowed_with_fees',
                'rules_source_url': url,
                'rules_last_verified': datetime.utcnow()
            }
            
            content = soup.get_text().lower()
            
            # Extract rules based on content
            if 'scalping' in content and 'not allowed' in content:
                rules['hft_allowed'] = False
                rules['hft_min_hold_time'] = 60
            
            return rules
            
        except Exception as e:
            logger.error(f"Error scraping QuantTekel rules: {str(e)}")
            return None
    
    def scrape_generic_prop_firm_rules(self, firm_name, website_url):
        """Generic scraper for other prop firms"""
        try:
            if not website_url:
                return None
                
            response = self.session.get(website_url, timeout=30)
            soup = BeautifulSoup(response.content, 'html.parser')
            content = soup.get_text().lower()
            
            # Default conservative rules
            rules = {
                'hft_allowed': False,
                'hft_min_hold_time': 60,
                'hft_max_trades_per_day': 10,
                'martingale_allowed': False,
                'martingale_max_positions': 1,
                'max_lot_size': 10.0,
                'max_risk_per_trade': 3.0,
                'reverse_trading_allowed': False,
                'reverse_trading_cooldown': 60,
                'daily_loss_limit': 4.0,
                'max_drawdown': 8.0,
                'profit_target_phase1': 8.0,
                'profit_target_phase2': 5.0,
                'min_trading_days': 7,
                'consistency_rule': 25.0,
                'leverage_forex': 100,
                'leverage_metals': 100,
                'leverage_crypto': 100,
                'news_trading': 'restricted',
                'weekend_holding': 'allowed',
                'rules_source_url': website_url,
                'rules_last_verified': datetime.utcnow()
            }
            
            # Try to extract specific rules based on common patterns
            if 'scalping' in content:
                if 'allowed' in content and 'not' not in content:
                    rules['hft_allowed'] = True
                    rules['hft_min_hold_time'] = 30
                else:
                    rules['hft_allowed'] = False
            
            if 'martingale' in content:
                if 'not allowed' in content or 'prohibited' in content:
                    rules['martingale_allowed'] = False
                elif 'allowed' in content:
                    rules['martingale_allowed'] = True
            
            if 'reverse' in content and 'position' in content:
                if 'not allowed' in content or 'prohibited' in content:
                    rules['reverse_trading_allowed'] = False
                elif 'allowed' in content:
                    rules['reverse_trading_allowed'] = True
            
            # Extract lot size limits
            lot_pattern = r'(\d+(?:\.\d+)?)\s*(?:lot|lots)'
            lot_matches = re.findall(lot_pattern, content)
            if lot_matches:
                max_lot = max([float(x) for x in lot_matches])
                rules['max_lot_size'] = max_lot
            
            # Extract risk percentages
            risk_pattern = r'(\d+(?:\.\d+)?)\s*%'
            risk_matches = re.findall(risk_pattern, content)
            if risk_matches:
                max_risk = max([float(x) for x in risk_matches])
                if max_risk <= 10:  # Reasonable risk limit
                    rules['max_risk_per_trade'] = max_risk
            
            return rules
            
        except Exception as e:
            logger.error(f"Error scraping generic rules for {firm_name}: {str(e)}")
            return None
    
    def update_prop_firm_rules(self, firm_name, rules):
        """Update prop firm rules in the database"""
        try:
            prop_firm = PropFirm.query.filter_by(name=firm_name).first()
            
            if prop_firm:
                # Update existing rules
                prop_firm.hft_allowed = rules.get('hft_allowed')
                prop_firm.hft_min_hold_time = rules.get('hft_min_hold_time')
                prop_firm.hft_max_trades_per_day = rules.get('hft_max_trades_per_day')
                prop_firm.martingale_allowed = rules.get('martingale_allowed')
                prop_firm.martingale_max_positions = rules.get('martingale_max_positions')
                prop_firm.max_lot_size = rules.get('max_lot_size')
                prop_firm.max_risk_per_trade = rules.get('max_risk_per_trade')
                prop_firm.reverse_trading_allowed = rules.get('reverse_trading_allowed')
                prop_firm.reverse_trading_cooldown = rules.get('reverse_trading_cooldown')
                prop_firm.daily_loss_limit = rules.get('daily_loss_limit')
                prop_firm.max_drawdown = rules.get('max_drawdown')
                prop_firm.profit_target_phase1 = rules.get('profit_target_phase1')
                prop_firm.profit_target_phase2 = rules.get('profit_target_phase2')
                prop_firm.min_trading_days = rules.get('min_trading_days')
                prop_firm.consistency_rule = rules.get('consistency_rule')
                prop_firm.leverage_forex = rules.get('leverage_forex')
                prop_firm.leverage_metals = rules.get('leverage_metals')
                prop_firm.leverage_crypto = rules.get('leverage_crypto')
                prop_firm.news_trading = rules.get('news_trading')
                prop_firm.weekend_holding = rules.get('weekend_holding')
                prop_firm.rules_source_url = rules.get('rules_source_url')
                prop_firm.rules_last_verified = rules.get('rules_last_verified')
                prop_firm.last_scraped = datetime.utcnow()
                prop_firm.scraping_status = 'success'
                prop_firm.scraping_error = None
            else:
                # Create new prop firm
                prop_firm = PropFirm(
                    name=firm_name,
                    hft_allowed=rules.get('hft_allowed'),
                    hft_min_hold_time=rules.get('hft_min_hold_time'),
                    hft_max_trades_per_day=rules.get('hft_max_trades_per_day'),
                    martingale_allowed=rules.get('martingale_allowed'),
                    martingale_max_positions=rules.get('martingale_max_positions'),
                    max_lot_size=rules.get('max_lot_size'),
                    max_risk_per_trade=rules.get('max_risk_per_trade'),
                    reverse_trading_allowed=rules.get('reverse_trading_allowed'),
                    reverse_trading_cooldown=rules.get('reverse_trading_cooldown'),
                    daily_loss_limit=rules.get('daily_loss_limit'),
                    max_drawdown=rules.get('max_drawdown'),
                    profit_target_phase1=rules.get('profit_target_phase1'),
                    profit_target_phase2=rules.get('profit_target_phase2'),
                    min_trading_days=rules.get('min_trading_days'),
                    consistency_rule=rules.get('consistency_rule'),
                    leverage_forex=rules.get('leverage_forex'),
                    leverage_metals=rules.get('leverage_metals'),
                    leverage_crypto=rules.get('leverage_crypto'),
                    news_trading=rules.get('news_trading'),
                    weekend_holding=rules.get('weekend_holding'),
                    rules_source_url=rules.get('rules_source_url'),
                    rules_last_verified=rules.get('rules_last_verified'),
                    last_scraped=datetime.utcnow(),
                    scraping_status='success'
                )
                db.session.add(prop_firm)
            
            db.session.commit()
            logger.info(f"Successfully updated rules for {firm_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating rules for {firm_name}: {str(e)}")
            db.session.rollback()
            return False
    
    def scrape_all_prop_firms(self):
        """Scrape rules for all prop firms in the database"""
        try:
            # Get all prop firms
            prop_firms = PropFirm.query.all()
            
            for firm in prop_firms:
                try:
                    logger.info(f"Scraping rules for {firm.name}")
                    
                    # Set scraping status to pending
                    firm.scraping_status = 'pending'
                    firm.last_scraped = datetime.utcnow()
                    db.session.commit()
                    
                    # Scrape rules based on firm name
                    rules = None
                    if 'ftmo' in firm.name.lower():
                        rules = self.scrape_ftmo_rules()
                    elif 'myforexfunds' in firm.name.lower() or 'mff' in firm.name.lower():
                        rules = self.scrape_myforexfunds_rules()
                    elif 'the5%ers' in firm.name.lower() or '5%ers' in firm.name.lower():
                        rules = self.scrape_the5percenters_rules()
                    elif 'quanttekel' in firm.name.lower() or 'quant tekel' in firm.name.lower():
                        rules = self.scrape_quanttekel_rules()
                    else:
                        # Use generic scraper for other firms
                        rules = self.scrape_generic_prop_firm_rules(firm.name, firm.website)
                    
                    if rules:
                        self.update_prop_firm_rules(firm.name, rules)
                    else:
                        # Mark as failed if no rules found
                        firm.scraping_status = 'failed'
                        firm.scraping_error = 'No rules found'
                        db.session.commit()
                    
                    # Add delay to avoid overwhelming servers
                    time.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Error scraping {firm.name}: {str(e)}")
                    firm.scraping_status = 'failed'
                    firm.scraping_error = str(e)
                    db.session.commit()
                    continue
            
            logger.info("Completed scraping all prop firms")
            return True
            
        except Exception as e:
            logger.error(f"Error in scrape_all_prop_firms: {str(e)}")
            return False
    
    def get_prop_firm_compliance_check(self, firm_name, trading_activity):
        """Check if trading activity complies with prop firm rules"""
        try:
            prop_firm = PropFirm.query.filter_by(name=firm_name).first()
            if not prop_firm:
                return {
                    'compliant': False,
                    'warnings': ['Prop firm not found in database'],
                    'recommendations': ['Contact support to add prop firm rules']
                }
            
            warnings = []
            recommendations = []
            compliant = True
            
            # Check HFT compliance
            if prop_firm.hft_allowed is False and trading_activity.get('hold_time_seconds', 0) < 60:
                warnings.append(f"HFT not allowed. Minimum hold time: {prop_firm.hft_min_hold_time} seconds")
                compliant = False
                recommendations.append("Hold positions for at least 60 seconds")
            
            if prop_firm.hft_max_trades_per_day and trading_activity.get('trades_today', 0) > prop_firm.hft_max_trades_per_day:
                warnings.append(f"Maximum HFT trades per day exceeded: {prop_firm.hft_max_trades_per_day}")
                compliant = False
                recommendations.append("Reduce number of trades per day")
            
            # Check martingale compliance
            if prop_firm.martingale_allowed is False and trading_activity.get('martingale_positions', 0) > 1:
                warnings.append("Martingale strategy not allowed")
                compliant = False
                recommendations.append("Avoid increasing position sizes")
            
            # Check lot size compliance
            if prop_firm.max_lot_size and trading_activity.get('lot_size', 0) > prop_firm.max_lot_size:
                warnings.append(f"Lot size exceeds maximum: {prop_firm.max_lot_size}")
                compliant = False
                recommendations.append(f"Reduce lot size to maximum {prop_firm.max_lot_size}")
            
            # Check reverse trading compliance
            if prop_firm.reverse_trading_allowed is False and trading_activity.get('reverse_trading', False):
                warnings.append("Reverse trading not allowed")
                compliant = False
                recommendations.append("Wait before taking opposite positions")
            
            return {
                'compliant': compliant,
                'warnings': warnings,
                'recommendations': recommendations,
                'firm_rules': prop_firm.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Error checking compliance for {firm_name}: {str(e)}")
            return {
                'compliant': False,
                'warnings': ['Error checking compliance'],
                'recommendations': ['Contact support']
            }
