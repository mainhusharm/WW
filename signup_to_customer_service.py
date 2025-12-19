#!/usr/bin/env python3
"""
Signup to Customer Service Database Function
Extracted from database done copy - just the database function
"""

import sqlite3
import hashlib
import uuid
from datetime import datetime

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect("trading_platform.db")
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    """Hash password"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_customer_service_tables():
    """Create customer service tables if they don't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create customers table for customer service
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unique_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            membership_tier TEXT DEFAULT 'free',
            join_date TEXT NOT NULL,
            last_active TEXT,
            phone TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            payment_status TEXT DEFAULT 'pending',
            payment_date TEXT,
            questionnaire_completed BOOLEAN DEFAULT 0,
            account_type TEXT,
            prop_firm TEXT,
            account_size INTEGER DEFAULT 0
        )
    """)
    
    # Create customer_service_data table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer_service_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            questionnaire_data TEXT,
            screenshots TEXT,
            risk_management_plan TEXT,
            subscription_plan TEXT,
            account_type TEXT,
            prop_firm TEXT,
            account_size INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
        )
    """)
    
    conn.commit()
    conn.close()

def save_signup_to_customer_service(email, password, firstName, lastName, plan_type='premium'):
    """
    Save signup data to customer service database
    
    Args:
        email (str): User email
        password (str): User password
        firstName (str): User first name
        lastName (str): User last name
        plan_type (str): User plan type (default: 'premium')
    
    Returns:
        dict: Result with success status and user data
    """
    try:
        # Create tables if they don't exist
        create_customer_service_tables()
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists in customers table
        cursor.execute("SELECT id FROM customers WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return {"success": False, "error": "User already exists in customer service"}
        
        # Create unique username
        base_username = f"{firstName} {lastName}".strip() or "New User"
        username = base_username
        
        # Check if username exists and make it unique
        counter = 1
        while True:
            cursor.execute("SELECT id FROM customers WHERE name = ?", (username,))
            if not cursor.fetchone():
                break
            username = f"{base_username} ({counter})"
            counter += 1
        
        # Create customer in customers table
        password_hash = hash_password(password)
        unique_id = str(uuid.uuid4())[:8].upper()
        
        cursor.execute("""
            INSERT INTO customers (
                unique_id, name, email, password_hash, membership_tier,
                join_date, last_active, status, payment_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            unique_id, username, email, password_hash, plan_type,
            datetime.utcnow().isoformat(), datetime.utcnow().isoformat(),
            'active', 'pending', datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
        ))
        
        customer_id = cursor.lastrowid
        
        # Create customer service data
        cursor.execute("""
            INSERT INTO customer_service_data (
                customer_id, email, account_type, prop_firm, account_size, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            customer_id, email, plan_type, 'Unknown', 0,
            datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        print(f"✅ User saved to customer service database: {email} (Customer ID: {customer_id})")
        
        return {
            "success": True,
            "customer_id": customer_id,
            "unique_id": unique_id,
            "username": username,
            "email": email,
            "plan_type": plan_type
        }
        
    except Exception as e:
        print(f"❌ Error saving to customer service database: {str(e)}")
        return {"success": False, "error": str(e)}

# Example usage:
if __name__ == "__main__":
    # Test the function
    result = save_signup_to_customer_service(
        email="test@example.com",
        password="password123",
        firstName="John",
        lastName="Doe",
        plan_type="premium"
    )
    print(result)
