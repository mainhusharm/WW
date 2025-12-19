from flask import Blueprint, request, jsonify
from datetime import datetime

test_bp = Blueprint('test', __name__)

@test_bp.route('/test/prop-firm-rules', methods=['GET', 'OPTIONS'])
def test_prop_firm_rules():
    """Test prop firm rules endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        account_type = request.args.get('accountType', 'QuantTekel Instant')
        
        rules = {
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
        }
        
        return jsonify({ 
            'success': True,
            'accountType': account_type,
            'rules': rules,
            'lastUpdated': datetime.utcnow().isoformat(),
            'test': True
        })
        
    except Exception as error:
        print(f'Error in test prop firm rules: {error}')
        return jsonify({ 
            'success': False,
            'error': str(error),
            'test': True
        }), 500

@test_bp.route('/test/signals', methods=['GET', 'OPTIONS'])
def test_signals():
    """Test signals endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        signals = [
            {
                'id': 'test-signal-1',
                'type': 'forex',
                'symbol': 'EUR/USD',
                'action': 'buy',
                'entry': '1.0850',
                'stopLoss': '1.0800',
                'takeProfit': '1.0950',
                'confidence': 85,
                'source': 'test_bot',
                'status': 'active',
                'createdAt': datetime.utcnow().isoformat(),
                'expiresAt': (datetime.utcnow().replace(hour=23, minute=59, second=59)).isoformat(),
                'analysis': 'Test signal for verification',
                'performance': {
                    'views': 1,
                    'trades': 0,
                    'successRate': 0
                }
            }
        ]
        
        return jsonify({ 
            'success': True,
            'signals': signals,
            'total': len(signals),
            'lastUpdated': datetime.utcnow().isoformat(),
            'test': True
        })
        
    except Exception as error:
        print(f'Error in test signals: {error}')
        return jsonify({ 
            'success': False,
            'error': str(error),
            'test': True
        }), 500
