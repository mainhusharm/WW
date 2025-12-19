import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionPlan } from '../services/subscriptionService';

interface SubscriptionExpiredPopupProps {
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
}

const SubscriptionExpiredPopup: React.FC<SubscriptionExpiredPopupProps> = ({
  onClose,
  onSelectPlan
}) => {
  const { availablePlans, getDiscountCode } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    onSelectPlan(planId);
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 'FREE';
    return `$${plan.price}/${plan.duration === 30 ? 'month' : plan.duration === 90 ? '3 months' : '2 weeks'}`;
  };

  const getDiscountText = (plan: SubscriptionPlan) => {
    if (plan.id === 'pro' || plan.id === 'enterprise') {
      return '10% OFF - Limited Time!';
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Subscription Expired</h2>
            <p className="text-gray-300 text-lg">
              Your access has expired. Choose a plan to continue using TraderEdge Pro.
            </p>
            <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg mt-4 inline-block">
              <span className="font-bold">Special Offer:</span> 10% OFF on Pro & Enterprise plans!
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {availablePlans.map((plan) => {
              const discountText = getDiscountText(plan);
              const isDiscounted = plan.id === 'pro' || plan.id === 'enterprise';
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-gray-800 rounded-lg p-6 border-2 transition-all duration-300 hover:scale-105 ${
                    selectedPlan === plan.id
                      ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {/* Discount Badge */}
                  {discountText && (
                    <div className="absolute -top-3 -right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                      {discountText}
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-lg">
                        {plan.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {plan.duration === 14 ? '2 weeks' : plan.duration === 30 ? '1 month' : '3 months'}
                    </p>
                    <div className="text-2xl font-bold text-white">
                      {formatPrice(plan)}
                    </div>
                    {isDiscounted && (
                      <div className="text-sm text-gray-400 line-through mt-1">
                        ${Math.round(plan.price / 0.9)}/{plan.duration === 30 ? 'month' : plan.duration === 90 ? '3 months' : '2 weeks'}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-300">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="capitalize">
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                    {plan.features.length > 6 && (
                      <div className="text-sm text-gray-400">
                        +{plan.features.length - 6} more features
                      </div>
                    )}
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      selectedPlan === plan.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Maybe Later
            </button>
            {selectedPlan && (
              <button
                onClick={() => onSelectPlan(selectedPlan)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue with {availablePlans.find(p => p.id === selectedPlan)?.name}
              </button>
            )}
          </div>

          {/* Discount Code Display */}
          {selectedPlan && getDiscountCode(selectedPlan) && (
            <div className="mt-4 text-center">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg inline-block">
                <span className="font-bold">Discount Code:</span> {getDiscountCode(selectedPlan)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiredPopup;
