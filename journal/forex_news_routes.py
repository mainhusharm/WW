from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import requests
import os

forex_news_bp = Blueprint('forex_news', __name__)

@forex_news_bp.route('/news/forex-factory', methods=['GET', 'OPTIONS'])
def get_forex_news():
    """Get ForexFactory news with rate limiting protection"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get parameters
        currency = request.args.get('currency', 'ALL')
        year = request.args.get('year', datetime.now().year)
        month = request.args.get('month', datetime.now().month)
        day = request.args.get('day', datetime.now().day)
        
        # Try to get real news first
        try:
            real_news = fetch_forex_factory_news(year, month, day, currency)
            if real_news:
                return jsonify({
                    'success': True,
                    'news': real_news,
                    'fromCache': False,
                    'lastUpdated': datetime.utcnow().isoformat()
                })
        except Exception as e:
            print(f'ForexFactory API error: {e}')
        
        # Fallback to mock data
        mock_news = get_mock_forex_news()
        return jsonify({
            'success': True,
            'news': mock_news,
            'fromCache': False,
            'rateLimited': True,
            'lastUpdated': datetime.utcnow().isoformat()
        })
        
    except Exception as error:
        print(f'Error fetching forex news: {error}')
        return jsonify({ 
            'success': False,
            'error': str(error) 
        }), 500

def fetch_forex_factory_news(year, month, day, currency):
    """Fetch real news from ForexFactory API"""
    try:
        api_key = os.getenv('RAPIDAPI_KEY', '68dc9d220amsh35ccd500e6b2ff1p13e4e9jsn989df0c5acd2')
        
        url = f"https://forex-factory-scraper1.p.rapidapi.com/get_calendar_details"
        params = {
            'year': year,
            'month': month,
            'day': day,
            'currency': currency,
            'event_name': 'ALL',
            'timezone': 'GMT-06:00 Central Time (US & Canada)',
            'time_format': '12h'
        }
        
        headers = {
            'x-rapidapi-host': 'forex-factory-scraper1.p.rapidapi.com',
            'x-rapidapi-key': api_key
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return process_forex_factory_data(data)
        elif response.status_code == 429:
            # Rate limited
            raise Exception('Rate limited by ForexFactory API')
        else:
            raise Exception(f'API responded with status: {response.status_code}')
            
    except Exception as e:
        print(f'ForexFactory API error: {e}')
        raise e

def process_forex_factory_data(data):
    """Process ForexFactory API response"""
    if not data or not isinstance(data, list):
        return []
    
    processed_news = []
    for item in data:
        try:
            news_item = {
                'id': item.get('id', f"news-{datetime.utcnow().timestamp()}"),
                'title': item.get('event_name', item.get('title', 'Economic Event')),
                'currency': item.get('currency', 'USD'),
                'impact': item.get('impact', 'Medium'),
                'forecast': item.get('forecast', 'N/A'),
                'previous': item.get('previous', 'N/A'),
                'actual': item.get('actual', 'TBD'),
                'time': item.get('time', 'TBD'),
                'date': item.get('date', datetime.now().strftime('%Y-%m-%d')),
                'description': item.get('description', ''),
                'source': 'ForexFactory',
                'importance': map_impact_to_importance(item.get('impact', 'Medium'))
            }
            processed_news.append(news_item)
        except Exception as e:
            print(f'Error processing news item: {e}')
            continue
    
    return processed_news

def map_impact_to_importance(impact):
    """Map impact level to importance number"""
    impact_map = {
        'High': 3,
        'Medium': 2,
        'Low': 1
    }
    return impact_map.get(impact, 1)

def get_mock_forex_news():
    """Get mock forex news as fallback"""
    return [
        {
            'id': 'mock-1',
            'title': 'US Non-Farm Payrolls',
            'currency': 'USD',
            'impact': 'High',
            'forecast': '200K',
            'previous': '187K',
            'actual': 'TBD',
            'time': '8:30 AM',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'description': 'Monthly employment report showing job creation in the US',
            'source': 'ForexFactory',
            'importance': 3
        },
        {
            'id': 'mock-2',
            'title': 'ECB Interest Rate Decision',
            'currency': 'EUR',
            'impact': 'High',
            'forecast': '4.25%',
            'previous': '4.00%',
            'actual': 'TBD',
            'time': '1:15 PM',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'description': 'European Central Bank monetary policy decision',
            'source': 'ForexFactory',
            'importance': 3
        },
        {
            'id': 'mock-3',
            'title': 'UK CPI Inflation',
            'currency': 'GBP',
            'impact': 'Medium',
            'forecast': '4.2%',
            'previous': '4.6%',
            'actual': 'TBD',
            'time': '7:00 AM',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'description': 'Consumer Price Index showing inflation rate',
            'source': 'ForexFactory',
            'importance': 2
        },
        {
            'id': 'mock-4',
            'title': 'Bank of Canada Rate Decision',
            'currency': 'CAD',
            'impact': 'Medium',
            'forecast': '5.00%',
            'previous': '5.00%',
            'actual': 'TBD',
            'time': '10:00 AM',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'description': 'Bank of Canada monetary policy announcement',
            'source': 'ForexFactory',
            'importance': 2
        }
    ]
