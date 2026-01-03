from flask import Flask, jsonify, request
from forex_bot_system import ForexBotSystem

app = Flask(__name__)
bot = ForexBotSystem()

@app.route('/api/forex/generate-signal', methods=['POST'])
def generate_signal():
    data = request.get_json()
    asset = data.get('asset')
    # The timeframe is not used in the current bot logic, but it's good to have it here for future enhancements
    timeframe = data.get('timeframe')
    
    if not asset:
        return jsonify({'error': 'Asset not provided'}), 400

    signal = bot.analyze_pair(asset)

    if signal:
        return jsonify({'signal': signal.__dict__})
    else:
        return jsonify({'error': 'Could not generate signal for the asset'}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
