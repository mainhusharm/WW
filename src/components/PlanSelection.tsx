import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionPlan } from '../services/subscriptionService';

interface PlanSelectionProps {
  onPlanSelect: (planId: string) => void;
  selectedPlan?: string;
  showDiscounts?: boolean;
}

const PlanSelection: React.FC<PlanSelectionProps> = ({
  onPlanSelect,
  selectedPlan,
  showDiscounts = false
}) => {
  const { availablePlans, getDiscountCode } = useSubscription();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const formatPrice = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 'FREE';
    return `$${plan.price}/${plan.duration === 30 ? 'month' : plan.duration === 90 ? '3 months' : '2 weeks'}`;
  };

  const getDiscountText = (plan: SubscriptionPlan) => {
    if (showDiscounts && (plan.id === 'pro' || plan.id === 'enterprise')) {
      return '10% OFF - Limited Time!';
    }
    return null;
  };

  const getDiscountedPrice = (plan: SubscriptionPlan) => {
    if (showDiscounts && (plan.id === 'pro' || plan.id === 'enterprise')) {
      return Math.round(plan.price * 0.9);
    }
    return plan.price;
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'kickstarter':
        return '🛡️';
      case 'starter':
        return '🚀';
      case 'pro':
        return '⭐';
      case 'enterprise':
        return '👑';
      default:
        return '📦';
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'kickstarter':
        return 'border-green-500 bg-green-900 bg-opacity-20';
      case 'starter':
        return 'border-blue-500 bg-blue-900 bg-opacity-20';
      case 'pro':
        return 'border-yellow-500 bg-yellow-900 bg-opacity-20';
      case 'enterprise':
        return 'border-purple-500 bg-purple-900 bg-opacity-20';
      default:
        return 'border-gray-500 bg-gray-900 bg-opacity-20';
    }
  };

  const getButtonColor = (planId: string) => {
    switch (planId) {
      case 'kickstarter':
        return 'bg-green-600 hover:bg-green-700';
      case 'starter':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'pro':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'enterprise':
        return 'bg-purple-600 hover:bg-purple-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {availablePlans.map((plan) => {
        const isSelected = selectedPlan === plan.id;
        const isHovered = hoveredPlan === plan.id;
        const discountText = getDiscountText(plan);
        const discountedPrice = getDiscountedPrice(plan);
        const originalPrice = plan.price;
        const hasDiscount = showDiscounts && (plan.id === 'pro' || plan.id === 'enterprise');

        return (
          <div
            key={plan.id}
            className={`relative rounded-lg p-6 border-2 transition-all duration-300 cursor-pointer ${
              isSelected
                ? getPlanColor(plan.id)
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            } ${isHovered ? 'scale-105' : ''}`}
            onClick={() => onPlanSelect(plan.id)}
            onMouseEnter={() => setHoveredPlan(plan.id)}
            onMouseLeave={() => setHoveredPlan(null)}
          >
            {/* Discount Badge */}
            {discountText && (
              <div className="absolute -top-3 -right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold z-10">
                {discountText}
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{getPlanIcon(plan.id)}</div>
              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-gray-400 text-sm mb-3">
                {plan.duration === 14 ? '2 weeks' : plan.duration === 30 ? '1 month' : '3 months'}
              </p>
              
              {/* Pricing */}
              <div className="mb-2">
                <div className="text-2xl font-bold text-white">
                  {discountedPrice === 0 ? 'FREE' : `$${discountedPrice}`}
                </div>
                {hasDiscount && originalPrice > 0 && (
                  <div className="text-sm text-gray-400 line-through">
                    ${originalPrice}
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  {plan.duration === 30 ? 'per month' : plan.duration === 90 ? 'per 3 months' : 'for 2 weeks'}
                </div>
              </div>
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
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                isSelected
                  ? getButtonColor(plan.id)
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {isSelected ? 'Selected' : 'Select Plan'}
            </button>

            {/* Discount Code Display */}
            {isSelected && getDiscountCode(plan.id) && (
              <div className="mt-3 text-center">
                <div className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                  <span className="font-bold">Code:</span> {getDiscountCode(plan.id)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlanSelection;
