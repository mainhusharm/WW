import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Clock, Mail, CreditCard, Bitcoin, Shield } from 'lucide-react';

interface PaymentDetails {
  method: string;
  amount: number;
  plan: string;
  paymentId: string;
  timestamp: string;
  status?: string;
  transactionHash?: string;
  cryptocurrency?: string;
  coupon_code?: string;
  coupon_applied?: boolean;
  discount_amount?: number;
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    // Get payment details from localStorage or location state
    const storedDetails = localStorage.getItem('payment_details');
    const cryptoVerification = localStorage.getItem('crypto_verification');
    
    if (storedDetails) {
      setPaymentDetails(JSON.parse(storedDetails));
    } else if (cryptoVerification) {
      const cryptoData = JSON.parse(cryptoVerification);
      setPaymentDetails({
        method: 'crypto',
        amount: parseFloat(cryptoData.amount),
        plan: 'Selected Plan', // You might want to get this from context
        paymentId: cryptoData.transactionHash,
        timestamp: cryptoData.timestamp,
        status: cryptoData.status,
        transactionHash: cryptoData.transactionHash,
        cryptocurrency: cryptoData.crypto
      });
      setIsVerifying(true);
    }

    // Check completed steps from localStorage
    const completedStepsData = localStorage.getItem('completed_steps');
    if (completedStepsData) {
      setCompletedSteps(JSON.parse(completedStepsData));
    }
  }, []);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'paypal':
        return <Shield className="w-8 h-8 text-blue-600" />;
      case 'crypto':
        return <Bitcoin className="w-8 h-8 text-orange-500" />;
      default:
        return <CheckCircle className="w-8 h-8 text-green-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
      case 'pending_verification':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-green-400';
    }
  };

  const getStatusText = (method: string, status?: string) => {
    if (method === 'crypto') {
      switch (status) {
        case 'pending_verification':
          return 'Verification Pending';
        case 'completed':
          return 'Verified & Complete';
        case 'failed':
          return 'Verification Failed';
        default:
          return 'Under Review';
      }
    }
    return status === 'completed' ? 'Payment Confirmed' : 'Processing';
  };

  const nextSteps = [
    {
      step: 1,
      title: 'Complete Questionnaire',
      description: 'Tell us about your trading experience and goals',
      route: '/questionnaire',
      icon: '📋',
      estimatedTime: '5-10 minutes'
    },
    {
      step: 2,
      title: 'Risk Management Plan',
      description: 'Create your personalized risk management strategy',
      route: '/risk-management',
      icon: '🛡️',
      estimatedTime: '10-15 minutes'
    },
    {
      step: 3,
      title: 'Access Dashboard',
      description: 'Start using all premium features and tools',
      route: '/dashboard',
      icon: '🚀',
      estimatedTime: 'Immediate'
    }
  ];

  const handleNextStep = () => {
    const nextRoute = nextSteps[currentStep - 1]?.route;
    if (nextRoute) {
      navigate(nextRoute);
    }
  };

  const handleSkipToStep = (stepNumber: number) => {
    // Check if previous steps are completed
    const isStepAccessible = stepNumber === 1 || completedSteps.includes(stepNumber - 1);
    
    if (!isStepAccessible) {
      alert(`Please complete step ${stepNumber - 1} first before accessing step ${stepNumber}.`);
      return;
    }

    const route = nextSteps[stepNumber - 1]?.route;
    if (route) {
      setCurrentStep(stepNumber);
      navigate(route);
    }
  };

  const isStepCompleted = (stepNumber: number) => {
    return completedSteps.includes(stepNumber);
  };

  const isStepAccessible = (stepNumber: number) => {
    return stepNumber === 1 || completedSteps.includes(stepNumber - 1);
  };

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {isVerifying ? 'Payment Submitted!' : 'Payment Successful!'}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {isVerifying 
              ? 'Your cryptocurrency payment has been submitted for verification. You\'ll receive an email confirmation once verified.'
              : 'Thank you for your purchase! Your account has been activated and you now have full access to all features.'
            }
          </p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Payment Details</h2>
            <div className="flex items-center space-x-2">
              {getPaymentIcon(paymentDetails.method)}
              <span className={`font-semibold ${getStatusColor(paymentDetails.status)}`}>
                {getStatusText(paymentDetails.method, paymentDetails.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Plan</label>
                <p className="text-white font-semibold">{paymentDetails.plan}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                <p className="text-white font-semibold">${paymentDetails.amount.toFixed(2)} USD</p>
              </div>
              {paymentDetails.coupon_applied && paymentDetails.coupon_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Coupon Applied</label>
                  <div className="space-y-1">
                    <p className="text-white font-semibold text-green-400">{paymentDetails.coupon_code}</p>
                    {paymentDetails.discount_amount && (
                      <p className="text-sm text-green-400">Saved ${paymentDetails.discount_amount.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Payment Method</label>
                <p className="text-white font-semibold capitalize">{paymentDetails.method}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {paymentDetails.method === 'crypto' ? 'Transaction Hash' : 'Payment ID'}
                </label>
                <p className="text-white font-mono text-sm break-all bg-gray-700 p-2 rounded">
                  {paymentDetails.transactionHash || paymentDetails.paymentId}
                </p>
              </div>
              {paymentDetails.cryptocurrency && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cryptocurrency</label>
                  <p className="text-white font-semibold">{paymentDetails.cryptocurrency}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                <p className="text-white">{new Date(paymentDetails.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {isVerifying && (
            <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-600 rounded-xl">
              <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Verification in Progress</span>
              </div>
              <p className="text-sm text-gray-300">
                Your cryptocurrency payment is being verified on the blockchain. This process typically takes 1-24 hours. 
                You'll receive an email confirmation once the verification is complete.
              </p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Next Steps</h2>
          
          <div className="space-y-6">
            {nextSteps.map((step, index) => {
              const isCompleted = isStepCompleted(step.step);
              const isAccessible = isStepAccessible(step.step);
              const isCurrent = currentStep === step.step;
              
              return (
                <div
                  key={step.step}
                  className={`flex items-center p-6 rounded-xl border-2 transition-all ${
                    isCompleted
                      ? 'border-green-500 bg-green-500/10'
                      : isCurrent && isAccessible
                      ? 'border-blue-500 bg-blue-500/10'
                      : isAccessible
                      ? 'border-gray-600 bg-gray-700/50'
                      : 'border-red-500/50 bg-red-500/5 opacity-60'
                  }`}
                >
                  <div className="flex-shrink-0 mr-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent && isAccessible
                        ? 'bg-blue-500 text-white'
                        : isAccessible
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-red-500/50 text-red-300'
                    }`}>
                      {isCompleted ? '✓' : !isAccessible ? '🔒' : step.icon}
                    </div>
                  </div>

                  <div className="flex-grow">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      isCompleted ? 'text-green-400' : isAccessible ? 'text-white' : 'text-gray-500'
                    }`}>
                      {step.title}
                      {!isAccessible && <span className="text-red-400 ml-2">(Locked)</span>}
                    </h3>
                    <p className={`mb-2 ${isAccessible ? 'text-gray-400' : 'text-gray-600'}`}>
                      {step.description}
                    </p>
                    <p className={`text-sm ${isAccessible ? 'text-gray-500' : 'text-gray-600'}`}>
                      Estimated time: {step.estimatedTime}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <div className="text-green-400 font-semibold flex items-center">
                        <span className="mr-2">✓</span>
                        Completed
                      </div>
                    ) : isCurrent && isAccessible ? (
                      <button
                        onClick={handleNextStep}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center space-x-2"
                      >
                        <span>Start Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : isAccessible ? (
                      <button
                        onClick={() => handleSkipToStep(step.step)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                      >
                        Skip to This
                      </button>
                    ) : (
                      <div className="text-red-400 font-semibold flex items-center">
                        <span className="mr-2">🔒</span>
                        Locked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isVerifying && (
            <div className="mt-8 text-center">
              <button
                onClick={handleNextStep}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 flex items-center space-x-2 mx-auto"
              >
                <span>Continue Your Journey</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-center space-x-2 text-blue-400 mb-3">
              <Mail className="w-5 h-5" />
              <span className="font-medium">Need Help?</span>
            </div>
            <p className="text-gray-400 mb-4">
              If you have any questions about your payment or need assistance getting started, 
              our support team is here to help.
            </p>
            <a
              href="mailto:forex@traderedgepro.com"
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Contact Support: forex@traderedgepro.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
