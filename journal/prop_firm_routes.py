from flask import Blueprint, request, jsonify
from datetime import datetime

prop_firm_bp = Blueprint('prop_firm', __name__)

@prop_firm_bp.route('/prop-firm/rules', methods=['GET', 'OPTIONS'])
def get_prop_firm_rules():
    """Get prop firm rules based on account type"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        account_type = request.args.get('accountType', 'QuantTekel Instant')
        
        # Get rules based on account type
        rules = get_prop_firm_rules_data(account_type)
        
        return jsonify({ 
            'success': True,
            'accountType': account_type,
            'rules': rules,
            'lastUpdated': datetime.utcnow().isoformat()
        })
        
    except Exception as error:
        print(f'Error fetching prop firm rules: {error}')
        return jsonify({ 
            'success': False,
            'error': str(error) 
        }), 500

def get_prop_firm_rules_data(account_type):
    """Get prop firm rules data"""
    rules_database = {
        "QuantTekel Instant": {
            "name": "QuantTekel Instant",
            "accountSize": "$10,000",
            "challengeType": "Instant",
            "dailyLossLimit": "4%",
            "maxDrawdown": "8%",
            "profitTarget": "6%",
            "minTradingDays": "4 days",
            "weekendHolding": "Allowed with triple swap fees",
            "newsTrading": "Restricted 5 minutes before/after high-impact news",
            "leverage": {
                "forex": "1:30",
                "metals": "1:15", 
                "crypto": "1:1"
            },
            "consistencyRule": "30%",
            "tradingHours": "24/7",
            "minimumDeposit": "$100",
            "spread": "0.1 pips",
            "commission": "No commission",
            "stopLoss": "Optional",
            "takeProfit": "Optional"
        },
        "QuantTekel 2-Step": {
            "name": "QuantTekel 2-Step",
            "accountSize": "$10,000",
            "challengeType": "2-step",
            "dailyLossLimit": "4%",
            "maxDrawdown": "8%",
            "profitTarget": "6% per phase",
            "minTradingDays": "4 days per phase",
            "weekendHolding": "Allowed with triple swap fees",
            "newsTrading": "Restricted 5 minutes before/after high-impact news",
            "leverage": {
                "forex": "1:30",
                "metals": "1:15",
                "crypto": "1:1"
            },
            "consistencyRule": "30%",
            "tradingHours": "24/7",
            "minimumDeposit": "$250",
            "spread": "0.2 pips",
            "commission": "Low commission",
            "stopLoss": "Required",
            "takeProfit": "Required"
        },
        "QuantTekel Pro": {
            "name": "QuantTekel Pro",
            "accountSize": "$10,000",
            "challengeType": "Pro",
            "dailyLossLimit": "4%",
            "maxDrawdown": "8%",
            "profitTarget": "7%/5% (Advanced 2-Step)",
            "minTradingDays": "4 days per phase",
            "weekendHolding": "Allowed with triple swap fees",
            "newsTrading": "Restricted 5 minutes before/after high-impact news",
            "leverage": {
                "forex": "1:30",
                "metals": "1:15",
                "crypto": "1:1"
            },
            "consistencyRule": "30%",
            "tradingHours": "24/7",
            "minimumDeposit": "$500",
            "spread": "0.3 pips",
            "commission": "Standard commission",
            "stopLoss": "Required",
            "takeProfit": "Required"
        },
        "QuantTekel Premium": {
            "name": "QuantTekel Premium",
            "accountSize": "$10,000",
            "challengeType": "Premium",
            "dailyLossLimit": "4%",
            "maxDrawdown": "8%",
            "profitTarget": "8%/5% (Prime)",
            "minTradingDays": "4 days per phase",
            "weekendHolding": "Allowed with triple swap fees",
            "newsTrading": "Restricted 5 minutes before/after high-impact news",
            "leverage": {
                "forex": "1:30",
                "metals": "1:15",
                "crypto": "1:1"
            },
            "consistencyRule": "30%",
            "tradingHours": "24/7",
            "minimumDeposit": "$1000",
            "spread": "0.5 pips",
            "commission": "Premium commission",
            "stopLoss": "Required",
            "takeProfit": "Required"
        }
    }
    
    return rules_database.get(account_type, rules_database["QuantTekel Instant"])
