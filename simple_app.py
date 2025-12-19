from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "Simple app working"})

@app.route('/health')
def health():
    return jsonify({"status": "ok", "service": "flask-test-app"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting simple app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
