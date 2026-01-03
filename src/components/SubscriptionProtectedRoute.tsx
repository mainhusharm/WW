import React, { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useUser } from '../contexts/UserContext';
import { SubscriptionService } from '../services/subscriptionService';
import SubscriptionExpiredPopup from './SubscriptionExpiredPopup';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
  requiredFeatures?: string[];
  fallbackComponent?: React.ReactNode;
}

const SubscriptionProtectedRoute: React.FC<SubscriptionProtectedRouteProps> = ({
  children,
  requiredFeatures = [],
  fallbackComponent
}) => {
  const { access, isLoading, shouldShowDiscountPopup, renewSubscription } = useSubscription();
  const { user } = useUser();
  const [showExpiredPopup, setShowExpiredPopup] = useState(false);

  useEffect(() => {
    if (!isLoading && access.isExpired && shouldShowDiscountPopup) {
      setShowExpiredPopup(true);
    }
  }, [isLoading, access.isExpired, shouldShowDiscountPopup]);

  const handlePlanSelect = async (planId: string) => {
    try {
      await renewSubscription(planId);
      setShowExpiredPopup(false);
    } catch (error) {
      console.error('Failed to renew subscription:', error);
    }
  };

  const handleClosePopup = () => {
    setShowExpiredPopup(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading subscription...</p>
        </div>
      </div>
    );
  }

  // Check if user has access to dashboard
  if (!access.canAccessDashboard) {
    // Only show access restricted if user actually had a subscription that expired
    const subscriptionService = SubscriptionService.getInstance();
    const shouldShowRestricted = subscriptionService.shouldShowAccessRestricted(user?.id || '');
    
    if (shouldShowRestricted) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-gray-300 mb-6">
              Your subscription has expired. Please renew your subscription to continue using TraderEdge Pro.
            </p>
            <button
              onClick={() => setShowExpiredPopup(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Plans
            </button>
          </div>
        </div>
      );
    } else {
      // For new users without subscription, show basic dashboard
      return <>{children}</>;
    }
  }

  // Check specific feature requirements
  if (requiredFeatures.length > 0) {
    const hasRequiredFeatures = requiredFeatures.every(feature => {
      switch (feature) {
        case 'signals':
          return access.canAccessSignals;
        case 'journal':
          return access.canAccessJournal;
        case 'ai':
          return access.canAccessAI;
        case 'community':
          return access.canAccessCommunity;
        case 'backtesting':
          return access.canAccessBacktesting;
        case 'multi_account':
          return access.canAccessMultiAccount;
        default:
          return true;
      }
    });

    if (!hasRequiredFeatures) {
      if (fallbackComponent) {
        return <>{fallbackComponent}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Feature Not Available</h2>
            <p className="text-gray-300 mb-6">
              This feature is not included in your current plan. Upgrade to access this functionality.
            </p>
            <button
              onClick={() => setShowExpiredPopup(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {children}
      {showExpiredPopup && (
        <SubscriptionExpiredPopup
          onClose={handleClosePopup}
          onSelectPlan={handlePlanSelect}
        />
      )}
    </>
  );
};

export default SubscriptionProtectedRoute;
