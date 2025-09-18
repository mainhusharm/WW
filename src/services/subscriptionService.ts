export interface SubscriptionPlan {
  id: string;
  name: string;
  duration: number; // in days
  features: string[];
  price: number;
  currency: string;
  discountCode?: string;
}

export interface UserSubscription {
  userId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  features: string[];
  status: 'active' | 'expired' | 'cancelled';
}

export interface PlanAccess {
  canAccessDashboard: boolean;
  canAccessSignals: boolean;
  canAccessJournal: boolean;
  canAccessAI: boolean;
  canAccessCommunity: boolean;
  canAccessBacktesting: boolean;
  canAccessMultiAccount: boolean;
  remainingDays: number;
  isExpired: boolean;
  expiredFeatures: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  kickstarter: {
    id: 'kickstarter',
    name: 'Kickstarter',
    duration: 14, // 2 weeks
    features: [
      'risk_management_plan',
      'trading_signals',
      'risk_calculator',
      'phase_tracking',
      'prop_firm_analyzer'
    ],
    price: 0,
    currency: 'USD'
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    duration: 30, // 1 month
    features: [
      'risk_management_plan',
      'trading_signals',
      'risk_calculator',
      'phase_tracking',
      'prop_firm_analyzer',
      'email_support',
      'auto_lot_calculator'
    ],
    price: 99,
    currency: 'USD'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    duration: 30, // 1 month
    features: [
      'risk_management_plan',
      'trading_signals',
      'risk_calculator',
      'phase_tracking',
      'prop_firm_analyzer',
      'priority_support',
      'auto_lot_calculator',
      'private_community',
      'multi_account_tracker',
      'advanced_journal',
      'backtesting_tools',
      'ai_coach',
      'ai_analysis',
      'new_features'
    ],
    price: 199,
    currency: 'USD',
    discountCode: 'PRO10OFF'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    duration: 90, // 3 months
    features: [
      'risk_management_plan',
      'trading_signals',
      'risk_calculator',
      'phase_tracking',
      'prop_firm_analyzer',
      'priority_support_24_7',
      'auto_lot_calculator',
      'private_community',
      'multi_account_tracker',
      'advanced_journal',
      'professional_backtesting',
      'chart_analysis',
      'ai_coach_advanced',
      'ai_analysis_realtime',
      'ai_strategy_optimization'
    ],
    price: 499,
    currency: 'USD',
    discountCode: 'ENTERPRISE10OFF'
  }
};

export class SubscriptionService {
  private static instance: SubscriptionService;
  private subscriptions: Map<string, UserSubscription> = new Map();

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  // Create a new subscription
  createSubscription(userId: string, planId: string): UserSubscription {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + (plan.duration * 24 * 60 * 60 * 1000));

    const subscription: UserSubscription = {
      userId,
      planId,
      startDate: now,
      endDate,
      isActive: true,
      features: [...plan.features],
      status: 'active'
    };

    this.subscriptions.set(userId, subscription);
    this.saveToLocalStorage(userId, subscription);
    
    return subscription;
  }

  // Get user's current subscription
  getSubscription(userId: string): UserSubscription | null {
    let subscription = this.subscriptions.get(userId);
    
    if (!subscription) {
      subscription = this.loadFromLocalStorage(userId);
      if (subscription) {
        this.subscriptions.set(userId, subscription);
      }
    }

    if (subscription) {
      // Check if subscription is expired
      const now = new Date();
      if (now > subscription.endDate && subscription.status === 'active') {
        subscription.status = 'expired';
        subscription.isActive = false;
        this.saveToLocalStorage(userId, subscription);
      }
    }

    return subscription;
  }

  // Check user's access based on their subscription
  async checkAccess(userId: string): Promise<PlanAccess> {
    const subscription = this.getSubscription(userId);
    const now = new Date();
    
    // If no subscription exists, check backend for user features
    if (!subscription) {
      try {
        // Check backend for user features based on plan and payment
        const response = await fetch(`/api/users/${userId}/features`);
        if (response.ok) {
          const featureData = await response.json();
          if (featureData.success) {
            return {
              canAccessDashboard: featureData.features.canAccessDashboard,
              canAccessSignals: featureData.features.canAccessSignals,
              canAccessJournal: featureData.features.canAccessJournal,
              canAccessAI: featureData.features.canAccessAI,
              canAccessCommunity: featureData.features.canAccessCommunity,
              canAccessBacktesting: featureData.features.canAccessBacktesting,
              canAccessMultiAccount: featureData.features.canAccessMultiAccount,
              remainingDays: featureData.payment_status === 'completed' ? 999 : 0,
              isExpired: false,
              expiredFeatures: []
            };
          }
        }
      } catch (error) {
        console.log('Could not check backend features, using default access');
      }
      
      // Default access for new users without payment
      return {
        canAccessDashboard: true,
        canAccessSignals: false,
        canAccessJournal: false,
        canAccessAI: false,
        canAccessCommunity: false,
        canAccessBacktesting: false,
        canAccessMultiAccount: false,
        remainingDays: 0,
        isExpired: false,
        expiredFeatures: []
      };
    }
    
    // If subscription exists but is not active or expired, restrict access
    if (!subscription.isActive || subscription.status !== 'active') {
      return {
        canAccessDashboard: false,
        canAccessSignals: false,
        canAccessJournal: false,
        canAccessAI: false,
        canAccessCommunity: false,
        canAccessBacktesting: false,
        canAccessMultiAccount: false,
        remainingDays: 0,
        isExpired: true,
        expiredFeatures: []
      };
    }

    const remainingTime = subscription.endDate.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingTime / (24 * 60 * 60 * 1000)));
    const isExpired = remainingDays === 0;

    const plan = SUBSCRIPTION_PLANS[subscription.planId];
    const expiredFeatures = isExpired ? plan?.features || [] : [];

    return {
      canAccessDashboard: !isExpired,
      canAccessSignals: !isExpired && subscription.features.includes('trading_signals'),
      canAccessJournal: !isExpired && subscription.features.includes('advanced_journal'),
      canAccessAI: !isExpired && (subscription.features.includes('ai_coach') || subscription.features.includes('ai_coach_advanced')),
      canAccessCommunity: !isExpired && subscription.features.includes('private_community'),
      canAccessBacktesting: !isExpired && (subscription.features.includes('backtesting_tools') || subscription.features.includes('professional_backtesting')),
      canAccessMultiAccount: !isExpired && subscription.features.includes('multi_account_tracker'),
      remainingDays,
      isExpired,
      expiredFeatures
    };
  }

  // Get features based on plan type
  getPlanFeatures(planType: string): PlanAccess {
    const plan = SUBSCRIPTION_PLANS[planType];
    if (!plan) {
      // Default to basic access if plan not found
      return {
        canAccessDashboard: true,
        canAccessSignals: false,
        canAccessJournal: false,
        canAccessAI: false,
        canAccessCommunity: false,
        canAccessBacktesting: false,
        canAccessMultiAccount: false,
        remainingDays: 0,
        isExpired: false,
        expiredFeatures: []
      };
    }

    // Map plan features to access permissions
    const features = plan.features;
    return {
      canAccessDashboard: true, // All paid users get dashboard access
      canAccessSignals: features.includes('trading_signals'),
      canAccessJournal: features.includes('advanced_journal'),
      canAccessAI: features.includes('ai_coach') || features.includes('ai_coach_advanced'),
      canAccessCommunity: features.includes('private_community'),
      canAccessBacktesting: features.includes('backtesting_tools') || features.includes('professional_backtesting'),
      canAccessMultiAccount: features.includes('multi_account_tracker'),
      remainingDays: 999, // Unlimited for paid users
      isExpired: false,
      expiredFeatures: []
    };
  }

  // Check if user should see "Access Restricted" message
  shouldShowAccessRestricted(userId: string): boolean {
    const subscription = this.getSubscription(userId);
    
    // Only show access restricted if user had a subscription that expired
    return subscription !== null && subscription.status === 'expired';
  }

  // Get available plans for expired users (with discount)
  getAvailablePlansForExpiredUser(): SubscriptionPlan[] {
    return [
      SUBSCRIPTION_PLANS.starter,
      {
        ...SUBSCRIPTION_PLANS.pro,
        price: Math.round(SUBSCRIPTION_PLANS.pro.price * 0.9) // 10% discount
      },
      {
        ...SUBSCRIPTION_PLANS.enterprise,
        price: Math.round(SUBSCRIPTION_PLANS.enterprise.price * 0.9) // 10% discount
      }
    ];
  }

  // Renew subscription
  renewSubscription(userId: string, planId: string): UserSubscription {
    const existingSubscription = this.getSubscription(userId);
    const plan = SUBSCRIPTION_PLANS[planId];
    
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const now = new Date();
    const startDate = existingSubscription ? existingSubscription.endDate : now;
    const endDate = new Date(startDate.getTime() + (plan.duration * 24 * 60 * 60 * 1000));

    const subscription: UserSubscription = {
      userId,
      planId,
      startDate,
      endDate,
      isActive: true,
      features: [...plan.features],
      status: 'active'
    };

    this.subscriptions.set(userId, subscription);
    this.saveToLocalStorage(userId, subscription);
    
    return subscription;
  }

  // Cancel subscription
  cancelSubscription(userId: string): void {
    const subscription = this.getSubscription(userId);
    if (subscription) {
      subscription.status = 'cancelled';
      subscription.isActive = false;
      this.saveToLocalStorage(userId, subscription);
    }
  }

  // Check if user should see discount popup
  shouldShowDiscountPopup(userId: string): boolean {
    const subscription = this.getSubscription(userId);
    return subscription?.status === 'expired' || false;
  }

  // Get discount code for a plan
  getDiscountCode(planId: string): string | null {
    const plan = SUBSCRIPTION_PLANS[planId];
    return plan?.discountCode || null;
  }

  // Private methods for localStorage
  private saveToLocalStorage(userId: string, subscription: UserSubscription): void {
    try {
      localStorage.setItem(`subscription_${userId}`, JSON.stringify({
        ...subscription,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString()
      }));
    } catch (error) {
      console.error('Failed to save subscription to localStorage:', error);
    }
  }

  private loadFromLocalStorage(userId: string): UserSubscription | null {
    try {
      const stored = localStorage.getItem(`subscription_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate)
        };
      }
    } catch (error) {
      console.error('Failed to load subscription from localStorage:', error);
    }
    return null;
  }

  // Clean up expired subscriptions
  cleanupExpiredSubscriptions(): void {
    const now = new Date();
    for (const [userId, subscription] of this.subscriptions.entries()) {
      if (now > subscription.endDate && subscription.status === 'active') {
        subscription.status = 'expired';
        subscription.isActive = false;
        this.saveToLocalStorage(userId, subscription);
      }
    }
  }
}

export default SubscriptionService;
