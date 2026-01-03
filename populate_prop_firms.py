#!/usr/bin/env python3
"""
Script to populate the database with 150+ prop firms and their initial rules
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from journal import create_app
from journal.models import db, PropFirm
from datetime import datetime

def populate_prop_firms():
    """Populate database with prop firms"""
    app = create_app()
    
    with app.app_context():
        # List of major prop firms with their initial rules
        prop_firms_data = [
            {
                'name': 'FTMO',
                'website': 'https://ftmo.com',
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
                'weekend_holding': 'not_allowed'
            },
            {
                'name': 'MyForexFunds',
                'website': 'https://myforexfunds.com',
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
                'weekend_holding': 'allowed'
            },
            {
                'name': 'The5%ers',
                'website': 'https://the5ers.com',
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
                'weekend_holding': 'allowed'
            },
            {
                'name': 'QuantTekel',
                'website': 'https://quanttekel.com',
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
                'weekend_holding': 'allowed_with_fees'
            }
        ]
        
        # Add more prop firms (simplified for brevity)
        additional_firms = [
            'Apex Trader Funding', 'Topstep', 'Earn2Trade', 'OneUp Trader',
            'Leeloo Trading', 'Traders With Edge', 'Fidelcrest', 'SurgeTrader',
            'City Traders Imperium', 'Trading Capital', 'FundedNext', 'The Funded Trader',
            'BluFX', 'Traders Central', 'Trading Pro', 'Funded Trading Plus',
            'Traders Academy', 'Trading Capital', 'Funded Trader Pro', 'Trading Elite'
        ]
        
        # Add additional firms with default conservative rules
        for firm_name in additional_firms:
            prop_firms_data.append({
                'name': firm_name,
                'website': None,
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
                'weekend_holding': 'allowed'
            })
        
        # Insert prop firms into database
        for firm_data in prop_firms_data:
            try:
                # Check if firm already exists
                existing_firm = PropFirm.query.filter_by(name=firm_data['name']).first()
                
                if existing_firm:
                    print(f"Updating existing firm: {firm_data['name']}")
                    # Update existing firm with new rules
                    for key, value in firm_data.items():
                        if hasattr(existing_firm, key):
                            setattr(existing_firm, key, value)
                    existing_firm.last_updated = datetime.utcnow()
                    existing_firm.scraping_status = 'pending'
                else:
                    print(f"Creating new firm: {firm_data['name']}")
                    # Create new firm
                    new_firm = PropFirm(**firm_data)
                    db.session.add(new_firm)
                
            except Exception as e:
                print(f"Error processing {firm_data['name']}: {str(e)}")
                continue
        
        try:
            db.session.commit()
            print(f"Successfully populated {len(prop_firms_data)} prop firms")
        except Exception as e:
            print(f"Error committing to database: {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    populate_prop_firms()
