# Backend coupon system - Private implementation
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import hashlib
import json

class PrivateCouponSystem:
    def __init__(self):
        self.private_coupons = {
            # Private coupon that sets all plans to $0.10 - NEVER exposed to frontend
            "INTERNAL_DEV_OVERRIDE_2024": {
                "type": "override_price",
                "value": 0.10,
                "is_active": True,
                "is_private": True,  # Critical: ensures never shown in UI
                "valid_from": datetime(2024, 1, 1),
                "valid_until": datetime(2025, 12, 31),
                "applicable_plans": ["*"],  # All plans
                "max_uses": None,  # Unlimited
                "current_uses": 0,
                "description": "Internal development coupon - reduces all plans to $0.10"
            }
        }
        
        self.pricing_tiers = {
            "free": {"name": "Free", "price": 0.00},
            "pro": {"name": "Pro", "price": 29.99},
            "professional": {"name": "Professional", "price": 59.99},
            "elite": {"name": "Elite", "price": 99.99},
            "enterprise": {"name": "Enterprise", "price": 199.99}
        }
    
    def validate_coupon(self, coupon_code: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Validate coupon code - internal use only"""
        if coupon_code not in self.private_coupons:
            return False, None, "Coupon not found"
        
        coupon = self.private_coupons[coupon_code]
        
        if not coupon["is_active"]:
            return False, None, "Coupon inactive"
        
        now = datetime.now()
        if now < coupon["valid_from"] or now > coupon["valid_until"]:
            return False, None, "Coupon expired"
        
        if coupon["max_uses"] and coupon["current_uses"] >= coupon["max_uses"]:
            return False, None, "Usage limit exceeded"
        
        return True, coupon, None
    
    def apply_coupon_to_price(self, original_price: float, coupon_code: str, plan_id: str) -> Dict:
        """Apply coupon to pricing calculation"""
        is_valid, coupon, error = self.validate_coupon(coupon_code)
        
        if not is_valid:
            return {
                "final_price": original_price,
                "discount": 0,
                "applied": False,
                "error": error
            }
        
        # Check if coupon applies to this plan
        if "*" not in coupon["applicable_plans"] and plan_id not in coupon["applicable_plans"]:
            return {
                "final_price": original_price,
                "discount": 0,
                "applied": False,
                "error": "Coupon not applicable to this plan"
            }
        
        if coupon["type"] == "override_price":
            final_price = coupon["value"]
            discount = original_price - final_price
        elif coupon["type"] == "percentage":
            discount = (original_price * coupon["value"]) / 100
            final_price = original_price - discount
        elif coupon["type"] == "fixed_amount":
            discount = min(coupon["value"], original_price)
            final_price = original_price - discount
        else:
            final_price = original_price
            discount = 0
        
        # Ensure price doesn't go below 0
        final_price = max(0, final_price)
        discount = original_price - final_price
        
        return {
            "final_price": round(final_price, 2),
            "discount": round(discount, 2),
            "applied": True
        }
    
    def get_checkout_price(self, plan_id: str) -> float:
        """Get final checkout price with private coupon applied"""
        if plan_id not in self.pricing_tiers:
            raise ValueError(f"Invalid plan ID: {plan_id}")
        
        original_price = self.pricing_tiers[plan_id]["price"]
        
        # Always apply private coupon in development
        if os.getenv("NODE_ENV") == "development" or os.getenv("ENVIRONMENT") == "dev":
            result = self.apply_coupon_to_price(
                original_price, 
                "INTERNAL_DEV_OVERRIDE_2024", 
                plan_id
            )
            return result["final_price"]
        
        return original_price
    
    def get_public_coupons(self) -> List[Dict]:
        """Get only public coupons for UI display - excludes private ones"""
        return [
            {
                "code": code,
                "description": coupon["description"],
                "type": coupon["type"],
                "value": coupon["value"]
            }
            for code, coupon in self.private_coupons.items()
            if not coupon.get("is_private", False) and coupon["is_active"]
        ]
    
    def process_payment(self, user_id: str, plan_id: str, provided_amount: float) -> Dict:
        """Process payment with coupon validation"""
        expected_amount = self.get_checkout_price(plan_id)
        
        if abs(provided_amount - expected_amount) > 0.01:
            return {
                "success": False,
                "error": f"Invalid payment amount. Expected ${expected_amount}, got ${provided_amount}"
            }
        
        # Simulate payment processing
        transaction_id = f"txn_{int(datetime.now().timestamp())}_{hashlib.md5(user_id.encode()).hexdigest()[:8]}"
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "amount_charged": expected_amount,
            "plan_id": plan_id,
            "user_id": user_id
        }

# Global instance
coupon_system = PrivateCouponSystem()

# API endpoints (for backend use only)
def validate_coupon_api(coupon_code: str):
    return coupon_system.validate_coupon(coupon_code)

def get_checkout_price_api(plan_id: str):
    return coupon_system.get_checkout_price(plan_id)

def get_public_coupons_api():
    return coupon_system.get_public_coupons()

def process_payment_api(user_id: str, plan_id: str, amount: float):
    return coupon_system.process_payment(user_id, plan_id, amount)
