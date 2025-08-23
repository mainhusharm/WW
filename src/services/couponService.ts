// Private coupon service - not exposed to frontend UI
interface Coupon {
  code: string;
  type: 'percentage' | 'fixed_amount' | 'override_price';
  value: number;
  isActive: boolean;
  isPrivate: boolean;
  validFrom: Date;
  validUntil: Date;
  applicablePlans: string[];
  maxUses?: number;
  currentUses: number;
  description: string;
}

interface PricingPlan {
  id: string;
  name: string;
  originalPrice: number;
  currency: string;
}

class CouponService {
  private coupons: Map<string, Coupon> = new Map();

  constructor() {
    this.initializePrivateCoupons();
  }

  private initializePrivateCoupons(): void {
    // Private coupon that sets all plans to $0.10 - NOT displayed anywhere
    const privateCoupon: Coupon = {
      code: 'INTERNAL_DEV_OVERRIDE_2024',
      type: 'override_price',
      value: 0.10,
      isActive: true,
      isPrivate: true, // This ensures it's never shown in UI
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      applicablePlans: ['*'], // Applies to all plans
      maxUses: undefined, // Unlimited uses
      currentUses: 0,
      description: 'Internal development coupon - overrides all plan prices to $0.10'
    };

    this.coupons.set(privateCoupon.code, privateCoupon);
  }

  // Validate coupon code (only for internal/backend use)
  validateCoupon(couponCode: string): { isValid: boolean; coupon?: Coupon; error?: string } {
    const coupon = this.coupons.get(couponCode);

    if (!coupon) {
      return { isValid: false, error: 'Coupon not found' };
    }

    if (!coupon.isActive) {
      return { isValid: false, error: 'Coupon is inactive' };
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return { isValid: false, error: 'Coupon has expired' };
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return { isValid: false, error: 'Coupon usage limit exceeded' };
    }

    return { isValid: true, coupon };
  }

  // Apply coupon to pricing calculation
  applyCouponToPricing(
    originalPrice: number,
    couponCode: string,
    planId: string
  ): { finalPrice: number; discount: number; applied: boolean; error?: string } {
    const validation = this.validateCoupon(couponCode);

    if (!validation.isValid || !validation.coupon) {
      return {
        finalPrice: originalPrice,
        discount: 0,
        applied: false,
        error: validation.error
      };
    }

    const coupon = validation.coupon;

    // Check if coupon applies to this plan
    if (!coupon.applicablePlans.includes('*') && !coupon.applicablePlans.includes(planId)) {
      return {
        finalPrice: originalPrice,
        discount: 0,
        applied: false,
        error: 'Coupon not applicable to this plan'
      };
    }

    let finalPrice = originalPrice;
    let discount = 0;

    switch (coupon.type) {
      case 'percentage':
        discount = (originalPrice * coupon.value) / 100;
        finalPrice = originalPrice - discount;
        break;

      case 'fixed_amount':
        discount = Math.min(coupon.value, originalPrice);
        finalPrice = originalPrice - discount;
        break;

      case 'override_price':
        discount = originalPrice - coupon.value;
        finalPrice = coupon.value;
        break;
    }

    // Ensure price doesn't go below 0
    finalPrice = Math.max(0, finalPrice);
    discount = originalPrice - finalPrice;

    return {
      finalPrice: Number(finalPrice.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      applied: true
    };
  }

  // Internal method to use coupon (increment usage counter)
  useCoupon(couponCode: string): boolean {
    const coupon = this.coupons.get(couponCode);
    if (coupon && coupon.isActive) {
      coupon.currentUses++;
      return true;
    }
    return false;
  }

  // Get all public coupons (excludes private ones) - for UI display
  getPublicCoupons(): Coupon[] {
    return Array.from(this.coupons.values()).filter(coupon => !coupon.isPrivate && coupon.isActive);
  }

  // Internal method to check if a coupon exists (for backend validation)
  private couponExists(couponCode: string): boolean {
    return this.coupons.has(couponCode);
  }
}

// Singleton instance
const couponService = new CouponService();

// Export functions for use in pricing calculations
export const validateCoupon = (couponCode: string) => couponService.validateCoupon(couponCode);

export const applyCouponToPricing = (originalPrice: number, couponCode: string, planId: string) =>
  couponService.applyCouponToPricing(originalPrice, couponCode, planId);

export const useCoupon = (couponCode: string) => couponService.useCoupon(couponCode);

export const getPublicCoupons = () => couponService.getPublicCoupons();

// Private coupon code constant (for internal use only - NOT exported to frontend)
const PRIVATE_COUPON_CODE = 'INTERNAL_DEV_OVERRIDE_2024';

// Internal function to apply dev pricing (only for backend use)
export const applyDevPricing = (originalPrice: number, planId: string) => {
  return applyCouponToPricing(originalPrice, PRIVATE_COUPON_CODE, planId);
};

export default couponService;
