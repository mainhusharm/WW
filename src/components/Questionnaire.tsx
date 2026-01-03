import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CustomSelect from './CustomSelect';
import FuturisticBackground from './FuturisticBackground';
import { useUser } from '../contexts/UserContext';
import { propFirms } from '../data/propFirms';
import api from '../lib/api';
import { logActivity } from '../api/activity';
import { userFlowService } from '../services/userFlowService';
// PostgreSQL database integration

interface QuestionnaireAnswers {
  tradesPerDay: string;
  tradingSession: string;
  cryptoAssets: string[];
  forexAssets: string[];
  hasAccount: 'yes' | 'no';
  accountEquity: number | string;
  propFirm: string;
  accountType: string;
  accountSize: number | string;
  riskPercentage: number;
  riskRewardRatio: string;
  accountNumber: string;
}

const tradesPerDayOptions = [
  { value: '1-2', label: '1-2 (Recommended)' },
  { value: '3-5', label: '3-5' },
  { value: '6-10', label: '6-10' },
  { value: '10+', label: '10+' },
];

const tradingSessionOptions = [
  { value: 'asian', label: 'Asian Session (Tokyo)' },
  { value: 'european', label: 'European Session (London)' },
  { value: 'us', label: 'US Session (New York)' },
  { value: 'any', label: 'Any/All Sessions' },
];

const cryptoOptions = [
  "BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC", "LTC",
  "SHIB", "TRX", "LINK", "BCH", "XLM", "ALGO", "ATOM", "VET", "FIL", "ICP"
];

const forexOptionsList = {
  "Commodities & Indices": ["XAU/USD", "XAG/USD", "USOIL", "US30", "US100"],
  Majors: ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "USDCHF", "NZDUSD"],
  Minors: ["EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY", "EURAUD", "GBPAUD"],
  Exotics: ["USDTRY", "USDZAR", "USDMXN", "USDNOK", "USDSEK", "USDSGD", "USDHKD"]
};

const allCryptoOptions = cryptoOptions.map(c => ({ value: c, label: c }));
const allForexOptions = () => {
  const options = Object.entries(forexOptionsList).map(([group, pairs]) => ({
    label: group,
    options: pairs.map(p => ({ value: p, label: p }))
  }));
  const savedPairs = localStorage.getItem('customForexPairs');
  const customPairs = savedPairs ? JSON.parse(savedPairs) : [];
  if (customPairs.length > 0) {
    options.push({
      label: 'Custom',
      options: customPairs.map((p: string) => ({ value: p, label: p }))
    });
  }
  return options;
};

const Questionnaire: React.FC = () => {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    tradesPerDay: '1-2',
    tradingSession: 'any',
    cryptoAssets: [],
    forexAssets: [],
    hasAccount: 'no',
    accountEquity: '',
    propFirm: '',
    accountType: '',
    accountSize: '',
    riskPercentage: 1,
    riskRewardRatio: '2',
    accountNumber: '',
  });
  const [customPair, setCustomPair] = useState('');
  const [customPairs, setCustomPairs] = useState<string[]>(() => {
    const savedPairs = localStorage.getItem('customForexPairs');
    return savedPairs ? JSON.parse(savedPairs) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  
  // Get state from location
  const locationState = location.state as { fromPayment?: boolean; plan?: any } | undefined;

  // Function to save questionnaire data to PostgreSQL
  const saveQuestionnaireToDatabase = async (questionnaireData: any) => {
    try {
      console.log('Saving questionnaire data to PostgreSQL:', questionnaireData);
      
        const response = await fetch('https://trading-cors-proxy-gbhz.onrender.com/api/questionnaire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          user_id: user?.id || 'unknown',
          user_email: user?.email || 'unknown@example.com',
          user_name: user?.fullName || user?.name || 'Unknown User',
          trades_per_day: questionnaireData.tradesPerDay,
          trading_session: questionnaireData.tradingSession,
          crypto_assets: questionnaireData.cryptoAssets || [],
          forex_assets: questionnaireData.forexAssets || [],
          custom_forex_pairs: customPairs || [],
          has_account: questionnaireData.hasAccount,
          account_equity: questionnaireData.hasAccount === 'yes' ? parseFloat(questionnaireData.accountEquity as string) : null,
          prop_firm: questionnaireData.propFirm || null,
          account_type: questionnaireData.accountType || null,
          account_size: questionnaireData.accountSize ? parseFloat(questionnaireData.accountSize as string) : null,
          risk_percentage: questionnaireData.riskPercentage,
          risk_reward_ratio: questionnaireData.riskRewardRatio,
          account_number: questionnaireData.accountNumber || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save questionnaire data');
      }

      const result = await response.json();
      console.log('✅ Questionnaire data saved to PostgreSQL:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to save questionnaire to PostgreSQL:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Use centralized service to store data with exact precision
    const questionnaireService = await import('../services/questionnaireDataService');
    questionnaireService.default.storeQuestionnaireData(answers);
    
    console.log('User Answers:', answers);

    // Check if coming from payment flow
    const fromPayment = locationState?.fromPayment;
    const paymentPlan = locationState?.plan;

    // Mark questionnaire as completed
    localStorage.setItem('questionnaire_completed', 'true');
    
    // Mark questionnaire step as completed in user flow
    if (user?.email) {
      await userFlowService.markStepCompleted(user.email, 'questionnaire');
      localStorage.setItem(`questionnaire_completed_${user.email}`, 'true');
    }

    try {
      // Save questionnaire answers to backend directly
      if (user?.id) {
        try {
          const response = await api.post(`/api/users/${user.id}/questionnaire`, answers);
          if (response.status === 200) {
            console.log('Questionnaire saved to backend successfully');
            logActivity('questionnaire_submit', { answers });
          } else {
            console.warn('Failed to save questionnaire to backend, continuing with local storage');
          }
        } catch (apiError) {
          console.warn('API error saving questionnaire, continuing with local storage:', apiError);
        }
      } else {
        console.warn('No user ID available, skipping backend save');
      }

      // Save questionnaire data to PostgreSQL (in background - don't block the main flow)
      saveQuestionnaireToDatabase(answers);
    } catch (error) {
      console.warn('Backend not available, continuing with local storage:', error);
      // Continue without backend - this is expected in demo/offline mode
    }

    // Also save to user context immediately
    if (user) {
      const updatedUser = {
        ...user,
        tradingData: {
          propFirm: answers.propFirm,
          accountType: answers.accountType,
          accountSize: String(answers.accountSize), // Keep as string to preserve exact value
          riskPerTrade: String(answers.riskPercentage),
          riskRewardRatio: answers.riskRewardRatio,
          tradesPerDay: answers.tradesPerDay,
          tradingSession: answers.tradingSession,
          cryptoAssets: answers.cryptoAssets,
          forexAssets: answers.forexAssets,
          hasAccount: answers.hasAccount,
          tradingExperience: 'intermediate'
        }
      };
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      console.log('Updated user data with questionnaire answers:', updatedUser);
    }

    // Mark step 1 (questionnaire) as completed
    const completedSteps = JSON.parse(localStorage.getItem('completed_steps') || '[]');
    if (!completedSteps.includes(1)) {
      completedSteps.push(1);
      localStorage.setItem('completed_steps', JSON.stringify(completedSteps));
    }

    // Always navigate to consent form first, then to risk management plan
    navigate('/consent-form', { 
      state: { 
        fromQuestionnaire: true,
        questionnaireData: answers,
        plan: paymentPlan,
        answers: answers,
      } 
    });
    
    setIsLoading(false);
  };

  const isFormValid = () => {
    const requiredFields = ['propFirm', 'accountType', 'accountSize', 'tradesPerDay', 'tradingSession', 'accountNumber'];
    for (const field of requiredFields) {
      if (!answers[field as keyof QuestionnaireAnswers]) {
        console.log(`Validation failed: ${field} is missing`);
        return false;
      }
    }

    if (answers.hasAccount === 'yes' && !answers.accountEquity) {
      console.log('Validation failed: accountEquity is missing');
      return false;
    }

    console.log('Validation passed');
    return true;
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-4 relative">
      <FuturisticBackground />
      <div className="relative bg-transparent p-8 rounded-2xl w-full max-w-3xl z-10">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Trading Preferences</h2>
        <p className="mb-8 text-center text-gray-400">Help us tailor your experience by answering a few questions.</p>

        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Prop Firm</label>
            <CustomSelect
              options={propFirms.map(firm => ({ value: firm.name, label: firm.name }))}
              value={answers.propFirm}
              onChange={(value) => {
                const selectedFirm = propFirms.find(firm => firm.name === value);
                setAnswers({
                  ...answers,
                  propFirm: value as string,
                  accountType: '',
                  accountSize: '',
                });
              }}
              placeholder="Select a prop firm..."
            />
          </div>

          {answers.propFirm && (
            <>
              <div>
                <label className="block mb-2 text-lg font-semibold text-gray-300">Account Type</label>
                <CustomSelect
                  options={propFirms.find(firm => firm.name === answers.propFirm)?.accountTypes.map(type => ({ value: type, label: type })) || []}
                  value={answers.accountType}
                  onChange={(value) => {
                    console.log('Account type selected:', value);
                    setAnswers({ ...answers, accountType: value as string, accountSize: '' });
                  }}
                  placeholder="Select an account type..."
                />
              </div>
              {answers.accountType && (
                <div>
                  <label className="block mb-2 text-lg font-semibold text-gray-300">Account Size</label>
                  <CustomSelect
                    options={propFirms.find(firm => firm.name === answers.propFirm)?.accountSizes.map(size => ({ value: String(size), label: `$${size.toLocaleString()}` })) || []}
                    value={String(answers.accountSize)}
                    onChange={(value) => {
                      console.log('Account size selected:', value);
                      // Store as exact number to preserve precision
                      setAnswers({ ...answers, accountSize: parseInt(value) });
                    }}
                    placeholder="Select an account size..."
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Risk per Trade</label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={answers.riskPercentage}
                onChange={(e) => setAnswers({ ...answers, riskPercentage: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-lg font-semibold text-blue-400">{answers.riskPercentage.toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Preferred Risk:Reward Ratio</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['1', '2', '3', '4'].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAnswers({ ...answers, riskRewardRatio: ratio })}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 font-semibold ${
                    answers.riskRewardRatio === ratio
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-blue-400 hover:bg-blue-400/10'
                  }`}
                >
                  1:{ratio}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Default is 1:2. This means for every $1 you risk, you aim to make $2 in profit.
            </p>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">How many trades do you take per day?</label>
            <CustomSelect
              options={tradesPerDayOptions}
              value={answers.tradesPerDay}
              onChange={(value) => setAnswers({ ...answers, tradesPerDay: value as string })}
            />
            <p className="text-xs text-gray-400 mt-1">Note: You can change this in your settings once per week.</p>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Do you have an account already?</label>
            <CustomSelect
              options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
              value={answers.hasAccount}
              onChange={(value) => setAnswers({ ...answers, hasAccount: value as 'yes' | 'no' })}
            />
          </div>

          {answers.hasAccount === 'yes' && (
            <div>
              <label className="block mb-2 text-lg font-semibold text-gray-300">Current equity of that account</label>
              <input
                type="number"
                value={answers.accountEquity}
                onChange={(e) => setAnswers({ ...answers, accountEquity: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Enter your account equity"
              />
            </div>
          )}

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Which trading session suits you best?</label>
            <CustomSelect
              options={tradingSessionOptions}
              value={answers.tradingSession}
              onChange={(value) => setAnswers({ ...answers, tradingSession: value as string })}
            />
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Which crypto assets do you trade?</label>
            <CustomSelect
              options={allCryptoOptions}
              value={answers.cryptoAssets}
              onChange={(value) => setAnswers({ ...answers, cryptoAssets: value as string[] })}
              multiple
              placeholder="Select crypto assets..."
            />
            <button
              onClick={() => setAnswers({ ...answers, cryptoAssets: cryptoOptions })}
              className="text-xs text-blue-400 mt-1 hover:underline"
            >
              Select All
            </button>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Which forex pairs do you trade?</label>
            <CustomSelect
              options={allForexOptions()}
              value={answers.forexAssets}
              onChange={(value) => setAnswers({ ...answers, forexAssets: value as string[] })}
              multiple
              placeholder="Select forex pairs..."
            />
            <button
              onClick={() => setAnswers({ ...answers, forexAssets: Object.values(forexOptionsList).flat().concat(customPairs) })}
              className="text-xs text-blue-400 mt-1 hover:underline"
            >
              Select All
            </button>
            <div className="mt-2">
              <p className="text-xs text-gray-400">Your pair not here? Add it below:</p>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={customPair}
                  onChange={(e) => setCustomPair(e.target.value.toUpperCase())}
                  placeholder="e.g., EURNOK"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white"
                />
                <button
                  onClick={() => {
                    if (customPair && !customPairs.includes(customPair)) {
                      const newCustomPairs = [...customPairs, customPair];
                      setCustomPairs(newCustomPairs);
                      localStorage.setItem('customForexPairs', JSON.stringify(newCustomPairs));
                      setCustomPair('');
                    }
                  }}
                  className="p-2 bg-blue-600 rounded-r-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">
              Prop Firm Account Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={answers.accountNumber}
              onChange={(e) => setAnswers({ ...answers, accountNumber: e.target.value })}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter your prop firm account number"
              required
            />
            <div className="mt-3 p-3 bg-blue-600/20 border border-blue-600 rounded-lg">
              <p className="text-blue-300 text-sm font-semibold mb-2">ℹ️ IMPORTANT INFORMATION:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• This account number must be from your prop firm that you are using to pass with our website</li>
                <li>• This will be used for account verification and support purposes if you have any problems in the future</li>
                <li>• Your account information will be securely stored and only accessible to support staff</li>
                <li>• This helps us provide better assistance and verify your trading account status</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isFormValid() || isLoading}
          className="w-full mt-8 p-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-blue-500/50 disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Preferences & Continue'}
        </button>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
