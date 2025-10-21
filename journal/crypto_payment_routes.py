import os
import requests
from flask import Blueprint, request, jsonify
from .extensions import db
from .models import User

crypto_payment_bp = Blueprint('crypto_payment', __name__)

ETHERSCAN_API_KEY = os.environ.get("ETHERSCAN_API_KEY")
SOLSCAN_API_KEY = os.environ.get("SOLSCAN_API_KEY")
ETH_WALLET_ADDRESS = os.environ.get("ETH_WALLET_ADDRESS")
SOL_WALLET_ADDRESS = os.environ.get("SOL_WALLET_ADDRESS")

@crypto_payment_bp.route('/verify-eth-payment', methods=['POST'])
def verify_eth_payment():
    """Verify an Ethereum payment"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400

    tx_hash = data.get('tx_hash')
    user_id = data.get('user_id')
    plan = data.get('plan')

    if not all([tx_hash, user_id, plan]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Verify the transaction with Etherscan
        url = f"https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash={tx_hash}&apikey={ETHERSCAN_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        tx_data = response.json().get('result')

        if not tx_data:
            return jsonify({'error': 'Transaction not found'}), 404

        # Check if the transaction was successful
        to_address = tx_data.get('to')
        if not to_address or to_address.lower() != ETH_WALLET_ADDRESS.lower():
            return jsonify({'error': 'Invalid recipient address'}), 400

        # In a real application, you would also check the transaction amount
        # and confirm that it matches the plan price.

        user = User.query.get(user_id)
        if user:
            user.membership_tier = plan
            db.session.commit()
            return jsonify({'message': 'Payment successful and membership updated'}), 200
        else:
            return jsonify({'error': 'User not found'}), 404

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f"Error communicating with Etherscan: {e}"}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@crypto_payment_bp.route('/verify-sol-payment', methods=['POST'])
def verify_sol_payment():
    """Verify a Solana payment"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400

    tx_hash = data.get('tx_hash')
    user_id = data.get('user_id')
    plan = data.get('plan')

    if not all([tx_hash, user_id, plan]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Verify the transaction with Solscan
        headers = {'Authorization': f'Bearer {SOLSCAN_API_KEY}'}
        url = f"https://public-api.solscan.io/transaction/{tx_hash}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        tx_data = response.json()

        if not tx_data:
            return jsonify({'error': 'Transaction not found'}), 404

        # In a real application, you would parse the transaction data to verify
        # the recipient address and the amount.

        user = User.query.get(user_id)
        if user:
            user.membership_tier = plan
            db.session.commit()
            return jsonify({'message': 'Payment successful and membership updated'}), 200
        else:
            return jsonify({'error': 'User not found'}), 404

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f"Error communicating with Solscan: {e}"}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
