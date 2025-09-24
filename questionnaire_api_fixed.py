#!/usr/bin/env python3
"""
Fixed Questionnaire API Endpoint
This fixes the issues with questionnaire data not properly syncing with the user dashboard.
"""

from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime
import json

app = Flask(__name__)

# Database configuration
DB_PATH = "trading_bots.db"

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_customer_service_table():
    """Create the customer_service_data table if it doesn't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_service_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            account_type TEXT NOT NULL,
            package_value INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route("/api/questionnaire", methods=["POST"])
def save_questionnaire():
    """Save questionnaire data with proper mapping"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        account_type = data.get('accountType')
        package = data.get('package')
        
        if not all([user_id, account_type]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400
        
        # Create table if it doesn't exist
        create_customer_service_table()
        
        # Map account types to package values based on user selection
        package_mapping = {
            "Instant Account": 10450,
            "2-Step Account": 10448,
            "Pro Account": 10452,
            "Premium Account": 10455,
            "QuantTekel Instant": 10450,
            "QuantTekel 2-Step": 10448,
            "QuantTekel Pro": 10452,
            "QuantTekel Premium": 10455
        }
        
        # Get the mapped package value
        mapped_value = package_mapping.get(account_type, package)
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO customer_service_data (user_id, account_type, package_value, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (user_id) DO UPDATE SET
                account_type = excluded.account_type,
                package_value = excluded.package_value,
                updated_at = excluded.updated_at
        ''', (user_id, account_type, mapped_value, datetime.now()))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Questionnaire saved: User {user_id}, Type: {account_type}, Value: {mapped_value}")
        
        return jsonify({
            "success": True,
            "message": "Questionnaire data saved successfully",
            "data": {
                "user_id": user_id,
                "account_type": account_type,
                "package_value": mapped_value
            }
        })
        
    except Exception as e:
        print(f"❌ Error saving questionnaire: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/questionnaire/<int:user_id>", methods=["GET"])
def get_questionnaire(user_id):
    """Get questionnaire data for a specific user"""
    try:
        create_customer_service_table()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, account_type, package_value, created_at, updated_at
            FROM customer_service_data
            WHERE user_id = ?
        ''', (user_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return jsonify({
                "success": True,
                "data": {
                    "user_id": result['user_id'],
                    "account_type": result['account_type'],
                    "package_value": result['package_value'],
                    "created_at": result['created_at'],
                    "updated_at": result['updated_at']
                }
            })
        else:
            return jsonify({
                "success": False,
                "error": "No questionnaire data found for this user"
            }), 404
            
    except Exception as e:
        print(f"❌ Error getting questionnaire: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/questionnaire", methods=["GET"])
def get_all_questionnaires():
    """Get all questionnaire data (for admin/debugging)"""
    try:
        create_customer_service_table()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, account_type, package_value, created_at, updated_at
            FROM customer_service_data
            ORDER BY updated_at DESC
        ''')
        
        results = cursor.fetchall()
        conn.close()
        
        questionnaires = []
        for row in results:
            questionnaires.append({
                "user_id": row['user_id'],
                "account_type": row['account_type'],
                "package_value": row['package_value'],
                "created_at": row['created_at'],
                "updated_at": row['updated_at']
            })
        
        return jsonify({
            "success": True,
            "count": len(questionnaires),
            "data": questionnaires
        })
        
    except Exception as e:
        print(f"❌ Error getting all questionnaires: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/questionnaire/<int:user_id>", methods=["PUT"])
def update_questionnaire(user_id):
    """Update questionnaire data for a specific user"""
    try:
        data = request.get_json()
        account_type = data.get('accountType')
        package = data.get('package')
        
        if not account_type:
            return jsonify({"success": False, "error": "Missing accountType field"}), 400
        
        # Create table if it doesn't exist
        create_customer_service_table()
        
        # Map account types to package values based on user selection
        package_mapping = {
            "Instant Account": 10450,
            "2-Step Account": 10448,
            "Pro Account": 10452,
            "Premium Account": 10455,
            "QuantTekel Instant": 10450,
            "QuantTekel 2-Step": 10448,
            "QuantTekel Pro": 10452,
            "QuantTekel Premium": 10455
        }
        
        # Get the mapped package value
        mapped_value = package_mapping.get(account_type, package)
        
        # Update database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE customer_service_data
            SET account_type = ?, package_value = ?, updated_at = ?
            WHERE user_id = ?
        ''', (account_type, mapped_value, datetime.now(), user_id))
        
        if cursor.rowcount == 0:
            # If no rows were updated, insert new record
            cursor.execute('''
                INSERT INTO customer_service_data (user_id, account_type, package_value, updated_at)
                VALUES (?, ?, ?, ?)
            ''', (user_id, account_type, mapped_value, datetime.now()))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Questionnaire updated: User {user_id}, Type: {account_type}, Value: {mapped_value}")
        
        return jsonify({
            "success": True,
            "message": "Questionnaire data updated successfully",
            "data": {
                "user_id": user_id,
                "account_type": account_type,
                "package_value": mapped_value
            }
        })
        
    except Exception as e:
        print(f"❌ Error updating questionnaire: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/questionnaire/<int:user_id>", methods=["DELETE"])
def delete_questionnaire(user_id):
    """Delete questionnaire data for a specific user"""
    try:
        create_customer_service_table()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM customer_service_data WHERE user_id = ?', (user_id,))
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            print(f"✅ Questionnaire deleted for user {user_id}")
            
            return jsonify({
                "success": True,
                "message": "Questionnaire data deleted successfully"
            })
        else:
            conn.close()
            return jsonify({
                "success": False,
                "error": "No questionnaire data found for this user"
            }), 404
            
    except Exception as e:
        print(f"❌ Error deleting questionnaire: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 Starting Fixed Questionnaire API...")
    print("📝 Available endpoints:")
    print("  POST   /api/questionnaire          - Save questionnaire data")
    print("  GET    /api/questionnaire          - Get all questionnaires")
    print("  GET    /api/questionnaire/<user_id> - Get user questionnaire")
    print("  PUT    /api/questionnaire/<user_id> - Update user questionnaire")
    print("  DELETE /api/questionnaire/<user_id> - Delete user questionnaire")
    
    app.run(debug=True, host="0.0.0.0", port=5000)
