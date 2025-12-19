import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';

const SubscriptionStatus: React.FC = () => {
  const { subscription, access, isLoading } = useSubscription();

  if (isLoading || !subscription) {
    return null;
  }

  const getStatusColor = () => {
    if (access.isExpired) return 'text-red-500';
    if (access.remainingDays <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (access.isExpired) return 'Expired';
    if (access.remainingDays <= 3) return 'Expiring Soon';
    return 'Active';
  };

  const formatTimeRemaining = () => {
    if (access.isExpired) return 'Expired';
    if (access.remainingDays === 0) return 'Expires today';
    if (access.remainingDays === 1) return '1 day remaining';
    return `${access.remainingDays} days remaining`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {subscription.planId.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold capitalize">
              {subscription.planId} Plan
            </h3>
            <p className="text-gray-400 text-sm">
              {formatTimeRemaining()}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          <div className="text-gray-400 text-sm">
            {subscription.features.length} features
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {!access.isExpired && (
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Subscription Progress</span>
            <span>{access.remainingDays} days left</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                access.remainingDays <= 3 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{
                width: `${Math.max(0, (access.remainingDays / 30) * 100)}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Feature Access Indicators */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center text-sm">
          <div className={`w-2 h-2 rounded-full mr-2 ${access.canAccessSignals ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-300">Trading Signals</span>
        </div>
        <div className="flex items-center text-sm">
          <div className={`w-2 h-2 rounded-full mr-2 ${access.canAccessAI ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-300">AI Coach</span>
        </div>
        <div className="flex items-center text-sm">
          <div className={`w-2 h-2 rounded-full mr-2 ${access.canAccessJournal ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-300">Trading Journal</span>
        </div>
        <div className="flex items-center text-sm">
          <div className={`w-2 h-2 rounded-full mr-2 ${access.canAccessBacktesting ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-300">Backtesting</span>
        </div>
      </div>

      {/* Warning for expiring subscription */}
      {access.remainingDays <= 3 && !access.isExpired && (
        <div className="mt-3 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.688-1.36 3.453 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-200 text-sm">
              Your subscription expires in {access.remainingDays} day{access.remainingDays !== 1 ? 's' : ''}. Renew now to avoid service interruption.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
