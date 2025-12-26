import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertTriangle, FileText, CheckCircle, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import FuturisticBackground from './FuturisticBackground';

const ConsentFormPage: React.FC = () => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get questionnaire data from location state
  const { questionnaireData, plan, fromQuestionnaire } = location.state || {};

  useEffect(() => {
    // Redirect to questionnaire if no user or no questionnaire data
    if (!user) {
      navigate('/signin');
      return;
    }
    
    if (!questionnaireData && !fromQuestionnaire) {
      navigate('/questionnaire');
      return;
    }
  }, [user, questionnaireData, fromQuestionnaire, navigate]);

  const handleAccept = async () => {
    if (hasAgreed && user?.email) {
      setIsSubmitting(true);
      
      try {
        // Save consent to database
        if (user.id) {
          const response = await fetch(`/api/users/${user.id}/consent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              consent_accepted: true
            })
          });
          
          if (!response.ok) {
            console.error('Failed to save consent to database');
          }
        }
        
        // Use user-specific consent key
        const consentKey = `user_consent_accepted_${user.email}`;
        const visitKey = `user_has_visited_${user.email}`;
        
        localStorage.setItem(consentKey, 'true');
        localStorage.setItem(visitKey, 'true');
        
        // Mark consent step as completed in user flow
        if (user?.email) {
          const { userFlowService } = await import('../services/userFlowService');
          await userFlowService.markStepCompleted(user.email, 'consent');
          localStorage.setItem(`consent_completed_${user.email}`, 'true');
        }
        
        setTimeout(() => {
          // Navigate to risk management plan with questionnaire data
          navigate('/risk-management-plan', {
            state: {
              fromQuestionnaire: true,
              questionnaireData: questionnaireData,
              plan: plan,
              fromConsent: true
            }
          });
          setIsSubmitting(false);
        }, 1000);
      } catch (error) {
        console.error('Error saving consent:', error);
        // Still proceed with localStorage fallback
        const consentKey = `user_consent_accepted_${user.email}`;
        const visitKey = `user_has_visited_${user.email}`;
        
        localStorage.setItem(consentKey, 'true');
        localStorage.setItem(visitKey, 'true');
        
        setTimeout(() => {
          navigate('/risk-management-plan', {
            state: {
              fromQuestionnaire: true,
              questionnaireData: questionnaireData,
              plan: plan,
              fromConsent: true
            }
          });
          setIsSubmitting(false);
        }, 1000);
      }
    }
  };

  const handleDecline = () => {
    // Navigate back to questionnaire or sign out
    navigate('/questionnaire');
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-4 relative">
      <FuturisticBackground />
      <div className="relative bg-transparent p-8 rounded-2xl w-full max-w-4xl z-10">
        <div className="bg-gray-900 rounded-2xl border border-red-500/50 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-red-600/20 border-b border-red-500/50 p-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">MANDATORY LEGAL CONSENT</h2>
                <p className="text-red-300">Please read and accept all terms before proceeding</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-grow">
            <div className="space-y-6">
              {/* Risk Disclosure */}
              <div className="bg-gray-800/50 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <h3 className="text-xl font-bold text-red-400">CRITICAL RISK DISCLOSURE</h3>
                </div>
                <div className="space-y-3 text-gray-300">
                  <p className="font-semibold text-red-300">
                    TRADING INVOLVES SUBSTANTIAL RISK OF LOSS. You can lose some or all of your invested capital. Past performance does not guarantee future results.
                  </p>
                  <p>
                    <strong className="text-red-300">PROP FIRM CHALLENGES:</strong> Most traders fail prop firm challenges. Success rates are typically 5-15%. You may lose your challenge fee.
                  </p>
                  <p>
                    <strong className="text-red-300">LEVERAGE RISK:</strong> High leverage can result in rapid and substantial losses exceeding your initial investment.
                  </p>
                  <p>
                    <strong className="text-red-300">MARKET VOLATILITY:</strong> Financial markets are unpredictable and can move against your positions at any time.
                  </p>
                </div>
              </div>

              {/* Liability Waiver */}
              <div className="bg-gray-800/50 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-yellow-400">COMPLETE LIABILITY WAIVER</h3>
                </div>
                <div className="space-y-3 text-gray-300">
                  <p>
                    <strong className="text-yellow-300">NO RESPONSIBILITY FOR LOSSES:</strong> TraderEdge Pro, its owners, employees, and affiliates are NOT responsible for any trading losses, missed profits, or financial damages.
                  </p>
                  <p>
                    <strong className="text-yellow-300">YOUR DECISIONS:</strong> All trading decisions are entirely your own. We do not control your trading account or execute trades for you.
                  </p>
                  <p>
                    <strong className="text-yellow-300">NO GUARANTEES:</strong> We make no guarantees about profits, success rates, or challenge completion. Results vary significantly between individuals.
                  </p>
                  <p>
                    <strong className="text-yellow-300">TECHNICAL ISSUES:</strong> We are not liable for system downtime, signal delays, or technical failures that may affect your trading.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={handleDecline}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Decline & Exit</span>
              </button>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="w-5 h-5 rounded bg-gray-700 border-gray-500 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-white font-medium">I have read, understood, and agree to ALL terms and conditions.</span>
              </label>
              
              <button
                onClick={handleAccept}
                disabled={!hasAgreed || isSubmitting}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                  hasAgreed && !isSubmitting
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span>{isSubmitting ? 'Processing...' : 'Accept & Continue'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentFormPage;
