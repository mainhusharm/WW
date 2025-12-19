#!/usr/bin/env python3
"""
Real ForexFactory News Service
This service fetches real-time news from ForexFactory using the provided API
"""

import requests
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ForexFactory API configuration
FOREX_FACTORY_API_KEY = "68dc9d220amsh35ccd500e6b2ff1p13e4e9jsn989df0c5acd2"
FOREX_FACTORY_HOST = "forex-factory-scraper1.p.rapidapi.com"

def get_forex_factory_news(year=None, month=None, day=None, currency="ALL"):
    """Fetch real news from ForexFactory API"""
    try:
        # Use current date if not provided
        if not year:
            year = datetime.now().year
        if not month:
            month = datetime.now().month
        if not day:
            day = datetime.now().day
        
        url = f"https://{FOREX_FACTORY_HOST}/get_calendar_details"
        
        params = {
            "year": year,
            "month": month,
            "day": day,
            "currency": currency,
            "event_name": "ALL",
            "timezone": "GMT-06:00 Central Time (US & Canada)",
            "time_format": "12h"
        }
        
        headers = {
            "x-rapidapi-host": FOREX_FACTORY_HOST,
            "x-rapidapi-key": FOREX_FACTORY_API_KEY
        }
        
        print(f"🔍 Fetching ForexFactory news for {year}-{month:02d}-{day:02d}")
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Successfully fetched {len(data.get('events', []))} events")
            return data.get('events', [])
        else:
            print(f"❌ ForexFactory API error: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error fetching ForexFactory news: {str(e)}")
        return []

def format_forex_news(events):
    """Format ForexFactory events for frontend"""
    formatted_events = []
    
    for event in events:
        try:
            formatted_event = {
                "id": event.get('id', ''),
                "time": event.get('time', ''),
                "currency": event.get('currency', ''),
                "impact": event.get('impact', 'low').upper(),
                "event": event.get('event', ''),
                "actual": event.get('actual', ''),
                "forecast": event.get('forecast', ''),
                "previous": event.get('previous', ''),
                "timestamp": datetime.now().isoformat()
            }
            formatted_events.append(formatted_event)
        except Exception as e:
            print(f"⚠️ Error formatting event: {str(e)}")
            continue
    
    return formatted_events

@app.route('/api/forex-news', methods=['GET'])
def get_news():
    """Get ForexFactory news"""
    try:
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        day = request.args.get('day', type=int)
        currency = request.args.get('currency', 'ALL')
        
        # Fetch real news from ForexFactory
        events = get_forex_factory_news(year, month, day, currency)
        
        if events:
            formatted_events = format_forex_news(events)
            return jsonify({
                "success": True,
                "events": formatted_events,
                "source": "ForexFactory",
                "timestamp": datetime.now().isoformat()
            })
        else:
            # Return empty array if no events
            return jsonify({
                "success": True,
                "events": [],
                "source": "ForexFactory",
                "message": "No events found for the selected date",
                "timestamp": datetime.now().isoformat()
            })
            
    except Exception as e:
        print(f"❌ Error in news API: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "events": []
        }), 500

@app.route('/api/forex-news/today', methods=['GET'])
def get_today_news():
    """Get today's ForexFactory news"""
    try:
        today = datetime.now()
        events = get_forex_factory_news(today.year, today.month, today.day)
        
        if events:
            formatted_events = format_forex_news(events)
            return jsonify({
                "success": True,
                "events": formatted_events,
                "source": "ForexFactory",
                "date": today.strftime('%Y-%m-%d'),
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "success": True,
                "events": [],
                "source": "ForexFactory",
                "date": today.strftime('%Y-%m-%d'),
                "message": "No events found for today",
                "timestamp": datetime.now().isoformat()
            })
            
    except Exception as e:
        print(f"❌ Error in today's news API: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "events": []
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "ForexFactory News Service",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 ForexFactory News Service")
    print("=" * 40)
    print("📊 Endpoints:")
    print("   GET /api/forex-news - Get news for specific date")
    print("   GET /api/forex-news/today - Get today's news")
    print("   GET /health - Health check")
    print("=" * 40)
    app.run(host='0.0.0.0', port=5002, debug=True)
        