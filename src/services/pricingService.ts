import { applyDevPricing } from './couponService';

interface PricingTier {
  id: string;
  name: string;
  basePrice: number;
  currency: string;
  features: string[];
  isPopular?: boolean;
}

interface PricingCalculation {
  originalPrice: number;
  finalPrice: number;
  discount: number;
  couponApplied: boolean;
}

class PricingService {
  private pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      basePrice: 0,
      currency: 'USD',
      features: ['Basic signals', 'Limited journal entries', 'Basic analytics']
    },
    {
      id: 'pro',
      name: 'Pro',
      basePrice: 29.99,
      currency: 'USD',
      features: ['All signals', 'Unlimited journal', 'Advanced analytics', 'Risk management'],
      isPopular: true
    },
    {
      id: 'professional',
      name: 'Professional',
      basePrice: 59.99,
      currency: 'USD',
      features: ['Everything in Pro', 'Multi-account tracking', 'Custom alerts', 'API access']
    },
    {
      id: 'elite',
      name: 'Elite',
      basePrice: 99.99,
      currency: 'USD',
      features: ['Everything in Professional', 'Priority support', 'Custom indicators', 'White-label options']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      basePrice: 199.99,
      currency: 'USD',
      features: ['Everything in Elite', 'Team management', 'Custom integrations', 'Dedicated support']
    }
  ];

  getPricingTiers(): PricingTier[] {
    return this.pricingTiers;
  }

  getPricingTier(tierId: string): PricingTier | undefined {
    return this.pricingTiers.find(tier => tier.id === tierId);
  }

  // Calculate final pricing with internal coupon system
  calculatePricing(tierId: string, applyInternalDiscount: boolean = false): PricingCalculation {
    const tier = this.getPricingTier(tierId);
    
    if (!tier) {
      throw new Error(`Pricing tier ${tierId} not found`);
    }

    let result: PricingCalculation = {
      originalPrice: tier.basePrice,
      finalPrice: tier.basePrice,
      discount: 0,
      couponApplied: false
    };

    // Apply internal dev pricing if enabled (private coupon system)
    if (applyInternalDiscount && tier.basePrice > 0) {
      const couponResult = applyDevPricing(tier.basePrice, tierId);
      
      if (couponResult.applied) {
        result = {
          originalPrice: tier.basePrice,
          finalPrice: couponResult.finalPrice,
          discount: couponResult.discount,
          couponApplied: true
        };
      }
    }

    return result;
  }

  // Get display price (what users see in UI)
  getDisplayPrice(tierId: string): string {
    const tier = this.getPricingTier(tierId);
    
    if (!tier) {
      return 'N/A';
    }

    if (tier.basePrice === 0) {
      return 'Free';
    }

    return `$${tier.basePrice.toFixed(2)}`;
  }

  // Internal method for checkout/payment processing
  getCheckoutPrice(tierId: string): number {
    // Always apply internal discount for development/testing
    const isDevEnvironment = process.env.NODE_ENV === 'development' || 
                            process.env.REACT_APP_ENV === 'development';
    
    const pricing = this.calculatePricing(tierId, isDevEnvironment);
    return pricing.finalPrice;
  }
}

const pricingService = new PricingService();

export const getPricingTiers = () => pricingService.getPricingTiers();
export const getPricingTier = (tierId: string) => pricingService.getPricingTier(tierId);
export const calculatePricing = (tierId: string, applyDiscount?: boolean) => 
  pricingService.calculatePricing(tierId, applyDiscount);
export const getDisplayPrice = (tierId: string) => pricingService.getDisplayPrice(tierId);
export const getCheckoutPrice = (tierId: string) => pricingService.getCheckoutPrice(tierId);

export default pricingService;
