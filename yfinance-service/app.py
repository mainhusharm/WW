from flask import Flask, request, jsonify
import yfinance as yf
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/get_futures_prices', methods=['GET'])
def get_futures_prices():
    tickers_str = request.args.get('tickers')
    if not tickers_str:
        return jsonify({"error": "No tickers provided"}), 400

    tickers = tickers_str.split(',')
    data = yf.Tickers(tickers)
    
    response_data = {}
    for ticker in tickers:
        try:
            info = data.tickers[ticker].info
            # Get additional data for 24h high/low
            hist = data.tickers[ticker].history(period="1d")
            high_24h = hist['High'].iloc[-1] if not hist.empty else None
            low_24h = hist['Low'].iloc[-1] if not hist.empty else None
            
            response_data[ticker] = {
                'shortName': info.get('shortName'),
                'regularMarketPrice': info.get('regularMarketPrice'),
                'regularMarketChange': info.get('regularMarketChange'),
                'regularMarketChangePercent': info.get('regularMarketChangePercent'),
                'regularMarketVolume': info.get('regularMarketVolume'),
                'high24h': high_24h,
                'low24h': low_24h,
                'previousClose': info.get('previousClose')
            }
        except Exception as e:
            print(f"Could not fetch data for {ticker}: {e}")
            response_data[ticker] = {"error": f"Could not fetch data for {ticker}"}

    return jsonify(response_data)

if __name__ == '__main__':
    app.run(port=5002, debug=True)
