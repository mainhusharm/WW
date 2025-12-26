import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import SubscriptionService, { UserSubscription, PlanAccess, SubscriptionPlan, SUBSCRIPTION_PLANS } from '../services/subscriptionService';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  access: PlanAccess;
  availablePlans: SubscriptionPlan[];
  isLoading: boolean;
  refreshSubscription: () => void;
  createSubscription: (planId: string) => Promise<UserSubscription>;
  renewSubscription: (planId: string) => Promise<UserSubscription>;
  cancelSubscription: () => void;
  shouldShowDiscountPopup: boolean;
  getDiscountCode: (planId: string) => string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
  userId: string;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children, userId }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [access, setAccess] = useState<PlanAccess>({
    canAccessDashboard: true, // Allow basic access for new users
    canAccessSignals: false,
    canAccessJournal: false,
    canAccessAI: false,
    canAccessCommunity: false,
    canAccessBacktesting: false,
    canAccessMultiAccount: false,
    remainingDays: 0,
    isExpired: false, // Not expired for new users
    expiredFeatures: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowDiscountPopup, setShouldShowDiscountPopup] = useState(false);

  const subscriptionService = SubscriptionService.getInstance();

  const refreshSubscription = async () => {
    if (!userId) return;

    setIsLoading(true);
    
    // Clean up expired subscriptions
    subscriptionService.cleanupExpiredSubscriptions();
    
    // Get current subscription
    const currentSubscription = subscriptionService.getSubscription(userId);
    setSubscription(currentSubscription);
    
    // Check access (now async)
    const currentAccess = await subscriptionService.checkAccess(userId);
    setAccess(currentAccess);
    
    // Check if should show discount popup
    const shouldShow = subscriptionService.shouldShowDiscountPopup(userId);
    setShouldShowDiscountPopup(shouldShow);
    
    setIsLoading(false);
  };

  const createSubscription = async (planId: string): Promise<UserSubscription> => {
    const newSubscription = subscriptionService.createSubscription(userId, planId);
    refreshSubscription();
    return newSubscription;
  };

  const renewSubscription = async (planId: string): Promise<UserSubscription> => {
    const renewedSubscription = subscriptionService.renewSubscription(userId, planId);
    refreshSubscription();
    return renewedSubscription;
  };

  const cancelSubscription = () => {
    subscriptionService.cancelSubscription(userId);
    refreshSubscription();
  };

  const getDiscountCode = (planId: string): string | null => {
    return subscriptionService.getDiscountCode(planId);
  };

  const getAvailablePlans = (): SubscriptionPlan[] => {
    if (access.isExpired) {
      return subscriptionService.getAvailablePlansForExpiredUser();
    }
    // Use the imported SUBSCRIPTION_PLANS
    return Object.values(SUBSCRIPTION_PLANS || {});
  };

  useEffect(() => {
    if (userId) {
      refreshSubscription();
      
      // Set up interval to check subscription status every minute
      const interval = setInterval(() => {
        refreshSubscription();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [userId]);

  const value: SubscriptionContextType = {
    subscription,
    access,
    availablePlans: getAvailablePlans(),
    isLoading,
    refreshSubscription,
    createSubscription,
    renewSubscription,
    cancelSubscription,
    shouldShowDiscountPopup,
    getDiscountCode
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
