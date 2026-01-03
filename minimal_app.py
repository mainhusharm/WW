'''
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# Be specific about the origins allowed.
# Added localhost for development environments.
CORS(app, 
     resources={r"/api/*": { # Apply CORS to all routes starting with /api/
         "origins": ["https://www.traderedgepro.com", "http://localhost:3000", "http://127.0.0.1:5173"],
         "methods": ["GET", "POST", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True
     }})

@app.route('/api/test', methods=['GET', 'OPTIONS'])
def test_route():
    if request.method == 'OPTIONS':
        return jsonify({}), 200 # Pre-flight request
    return jsonify({"message": "CORS is working!"})

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login_route():
    if request.method == 'OPTIONS':
        return jsonify({}), 200 # Pre-flight request
    # In a real app, you'd have login logic here.
    # For this test, we'll just return a success message.
    return jsonify({"message": "Login endpoint is reachable"})

if __name__ == '__main__':
    app.run(debug=True)
'''