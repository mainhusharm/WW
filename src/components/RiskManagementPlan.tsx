import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Shield, Target, TrendingUp, AlertTriangle, Zap, Brain, Activity, DollarSign, BarChart3, Clock, CheckCircle } from 'lucide-react';
import api from '../api';
import { logActivity } from '../api/activity';

const RiskManagementPlan: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { answers, plan, fromQuestionnaire, questionnaireData } = location.state || {};
  
  // Use questionnaireData as primary source, fallback to answers
  const questionnaire = questionnaireData || answers;
  
  const [currentPlan, setPlan] = useState(plan);
  const [isGenerating, setIsGenerating] = useState(false);

  // State for stop loss and pip value with default values
  // TODO: These should ideally come from user input or a more sophisticated calculation
  const [stopLossPips, setStopLossPips] = useState(20); // Default stop loss in pips
  const [pipValue, setPipValue] = useState(10); // Default pip value for a standard lot (e.g., for EUR/USD)
  
  // New state for compounding and earnings projection
  const [compoundingMethod, setCompoundingMethod] = useState<'flat' | 'compounding'>('flat');
  const [showEarningsProjection, setShowEarningsProjection] = useState(false);


    // Calculate projected earnings based on win rate and compounding method
  const calculateProjectedEarnings = (winRate: number, method: 'flat' | 'compounding') => {
    const accountSize = planData.accountSize || 0;
    const riskPercentage = planData.riskPercentage || 1;
    const riskRewardRatio = planData.riskRewardRatio || 2;
    const tradingDays = 30;
    const tradesPerDay = planData.tradesPerDay === '1-2' ? 1.5 : 
                         planData.tradesPerDay === '3-4' ? 3.5 : 
                         planData.tradesPerDay === '5+' ? 6 : 1.5;
    
    let totalEarnings = 0;
    let currentBalance = accountSize;
    
    for (let day = 1; day <= tradingDays; day++) {
      const dailyTrades = Math.floor(tradesPerDay);
      let dailyEarnings = 0;
      
      for (let trade = 1; trade <= dailyTrades; trade++) {
        // Calculate risk amount based on method
        let riskAmount;
        if (method === 'flat') {
          riskAmount = accountSize * (riskPercentage / 100);
        } else {
          // Compounding: risk grows with current balance
          riskAmount = currentBalance * (riskPercentage / 100);
        }
        
        // Simulate trade outcome based on win rate
        const isWin = Math.random() * 100 < winRate;
        
        if (isWin) {
          // Win: gain risk amount * risk/reward ratio
          const winAmount = riskAmount * riskRewardRatio;
          dailyEarnings += winAmount;
          currentBalance += winAmount;
        } else {
          // Loss: lose risk amount
          dailyEarnings -= riskAmount;
          currentBalance -= riskAmount;
        }
      }
      
      totalEarnings += dailyEarnings;
    }
    
    return Math.max(0, totalEarnings);
  };

  // Generate comprehensive plan based on all questionnaire data
const generatePlan = (data: any) => {
    const accountSize = Number(data.accountSize) || 10000;
    const riskPercentage = data.riskPercentage || 1;
    const riskRewardRatio = Number(data.riskRewardRatio) || 2;
    const tradesPerDay = data.tradesPerDay || '1-2';
    const tradingSession = data.tradingSession || 'any';
    const propFirm = data.propFirm || '';
    const accountType = data.accountType || '';
    const hasAccount = data.hasAccount || 'no';
    const accountEquity = Number(data.accountEquity) || 0;
    const cryptoAssets = data.cryptoAssets || [];
    const forexAssets = data.forexAssets || [];
    
    // Calculate risk amounts
    const riskAmount = (accountSize * riskPercentage) / 100;
    const profitAmount = riskAmount * riskRewardRatio;
    
    // Determine profit target based on prop firm and account type
    let profitTargetPercentage = 0.08; // Default 8%
    if (propFirm.toLowerCase().includes('ftmo') || propFirm.toLowerCase().includes('myforexfunds')) {
      profitTargetPercentage = 0.10; // 10% for these firms
    } else if (propFirm.toLowerCase().includes('funded next')) {
      profitTargetPercentage = 0.06; // 6% for Funded Next
    }
    
    const profitTarget = accountSize * profitTargetPercentage;
    
    // Calculate trades needed based on trades per day preference
    const maxTradesPerDay = tradesPerDay === '1-2' ? 2 : 
                           tradesPerDay === '3-5' ? 5 : 
                           tradesPerDay === '6-10' ? 10 : 15;
    
    const idealTradesToPass = Math.ceil(profitTarget / profitAmount);
    const tradesToPass = Math.min(idealTradesToPass, maxTradesPerDay * 10); // Cap based on daily trades
    
    // Calculate daily targets
    const dailyProfitTarget = profitTarget / Math.ceil(tradesToPass / maxTradesPerDay);
    const dailyRiskAmount = riskAmount * maxTradesPerDay;
    
    // Session-specific recommendations
    const sessionRecommendations = {
      asian: 'Focus on JPY pairs and crypto during Asian session (9 PM - 6 AM EST)',
      european: 'Trade EUR/GBP pairs and commodities during London session (3 AM - 12 PM EST)',
      us: 'Trade USD pairs and indices during New York session (8 AM - 5 PM EST)',
      any: 'Flexible trading across all sessions based on market volatility'
    };
    
    const tradeByTradePlan = [];
    let currentBalance = accountSize;
    for (let i = 0; i < tradesToPass; i++) {
      const tradeRiskAmount = (currentBalance * riskPercentage) / 100;
      const tradeProfitAmount = tradeRiskAmount * riskRewardRatio;
      tradeByTradePlan.push({
        trade: i + 1,
        balance: currentBalance,
        riskAmount: tradeRiskAmount,
        profitTarget: tradeProfitAmount,
      });
      currentBalance += tradeProfitAmount;
    }

    return {
      tradesToPass,
      riskAmount,
      profitAmount,
      accountSize,
      riskPercentage,
      riskRewardRatio,
      profitTarget,
      profitTargetPercentage: profitTargetPercentage * 100,
      tradesPerDay,
      maxTradesPerDay,
      tradingSession,
      sessionRecommendation: sessionRecommendations[tradingSession as keyof typeof sessionRecommendations] || sessionRecommendations.any,
      propFirm,
      accountType,
      hasAccount,
      accountEquity,
      cryptoAssets,
      forexAssets,
      dailyProfitTarget,
      dailyRiskAmount,
      estimatedDaysToPass: Math.ceil(tradesToPass / maxTradesPerDay),
      tradeByTradePlan,
    };
  };

  // Handle case where we come from questionnaire with data
  useEffect(() => {
    // Try to get questionnaire data from multiple sources
    let questionnaireSource = questionnaire;
    
    // Fallback to localStorage if no data in location state
    if (!questionnaireSource) {
      const storedAnswers = localStorage.getItem('questionnaireAnswers');
      if (storedAnswers) {
        try {
          questionnaireSource = JSON.parse(storedAnswers);
        } catch (error) {
          console.error('Error parsing stored questionnaire answers:', error);
        }
      }
    }
    
    if ((fromQuestionnaire || !currentPlan) && questionnaireSource) {
      setIsGenerating(true);
      
      // Generate plan based on questionnaire data
      const generatedPlan = generatePlan(questionnaireSource);
      
      // Store the generated plan in state and localStorage
      setPlan(generatedPlan);
      localStorage.setItem('riskManagementPlan', JSON.stringify(generatedPlan));
      setIsGenerating(false);
      
      // Save plan to backend (optional)
      savePlanToBackend(generatedPlan);
    }
  }, [fromQuestionnaire, questionnaire]);
  
  const savePlanToBackend = async (planData: any) => {
    try {
      await api.post('/api/user/plan', {
        plan: planData,
        questionnaire: questionnaire
      });
      logActivity('risk_management_plan_saved', { plan: planData });
      console.log('Plan saved to backend successfully');
    } catch (error) {
      console.warn('Backend not available, plan saved locally:', error);
      // Continue anyway - don't block user flow for API failures
    }
  };

  // Show loading state while generating plan
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg">Generating your risk management plan...</p>
        </div>
      </div>
    );
  }

  // Try to get data from localStorage if no state data
  let finalQuestionnaire = questionnaire;
  if (!finalQuestionnaire) {
    const storedAnswers = localStorage.getItem('questionnaireAnswers');
    if (storedAnswers) {
      try {
        finalQuestionnaire = JSON.parse(storedAnswers);
      } catch (error) {
        console.error('Error parsing stored questionnaire answers:', error);
      }
    }
  }

  // Try to get stored plan if no current plan
  let finalPlan = currentPlan;
  if (!finalPlan) {
    const storedPlan = localStorage.getItem('riskManagementPlan');
    if (storedPlan) {
      try {
        finalPlan = JSON.parse(storedPlan);
      } catch (error) {
        console.error('Error parsing stored plan:', error);
      }
    }
  }

  // Redirect to questionnaire if no data available
  if (!finalQuestionnaire && !finalPlan) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p>No data available to generate a plan.</p>
        <button
          onClick={() => navigate('/questionnaire')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Questionnaire
        </button>
      </div>
    );
  }

  // Use current plan or generate from questionnaire data
  const planData = finalPlan || generatePlan(finalQuestionnaire || {});
  const { tradesToPass = 0, riskAmount = 0, profitAmount = 0 } = planData || {};

  // Calculate position size
  const positionSizeInLots = (riskAmount > 0 && stopLossPips > 0 && pipValue > 0)
    ? riskAmount / (stopLossPips * pipValue)
    : 0;
  const positionSizeInUnits = positionSizeInLots * 100000; // Assuming 1 lot = 100,000 units

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Futuristic Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-cyan-900/10"></div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-8">
        {/* Futuristic Header */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Neural Risk Management Protocol
            </h1>
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-Powered Trading Risk Analysis & Optimization System
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Account Overview - Futuristic Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prop Firm Details */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-green-400">Prop Firm Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Firm:</span>
                  <span className="text-white font-medium">{planData.propFirm || 'Not Set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Type:</span>
                  <span className="text-white font-medium">{planData.accountType || 'Not Set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Size:</span>
                  <span className="text-green-400 font-bold">${(planData.accountSize || 0).toLocaleString()}</span>
                </div>
                {planData.hasAccount === 'yes' && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Equity:</span>
                    <span className="text-green-400 font-bold">${(planData.accountEquity || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Risk Parameters */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 hover:border-red-400/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-red-400">Risk Parameters</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Per Trade:</span>
                  <span className="text-red-400 font-bold">{planData.riskPercentage || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk:Reward:</span>
                  <span className="text-white font-medium">1:{planData.riskRewardRatio || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Amount:</span>
                  <span className="text-red-400 font-bold">${(planData.riskAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profit Target:</span>
                  <span className="text-green-400 font-bold">${(planData.profitAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Schedule */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-blue-400">Trading Schedule</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trades Per Day:</span>
                  <span className="text-white font-medium">{planData.tradesPerDay || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Session:</span>
                  <span className="text-blue-400 font-medium capitalize">{planData.tradingSession || 'Any'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Daily Risk:</span>
                  <span className="text-red-400 font-bold">${(planData.dailyRiskAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Daily Target:</span>
                  <span className="text-green-400 font-bold">${(planData.dailyProfitTarget || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Analysis - Futuristic Stats */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-3xl blur opacity-20"></div>
          <div className="relative bg-gray-900/90 backdrop-blur-sm border border-blue-500/30 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Challenge Analysis Matrix
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Profit Target */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm border border-green-500/40 rounded-xl p-6 text-center hover:border-green-400/60 transition-all duration-300">
                  <div className="flex items-center justify-center mb-3">
                    <Target className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Profit Target</h3>
                  <p className="text-3xl font-bold text-green-400 mb-1">${(planData.profitTarget || 0).toFixed(0)}</p>
                  <p className="text-xs text-gray-400">{planData.profitTargetPercentage || 0}% of account</p>
                </div>
              </div>

              {/* Trades Needed */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm border border-blue-500/40 rounded-xl p-6 text-center hover:border-blue-400/60 transition-all duration-300">
                  <div className="flex items-center justify-center mb-3">
                    <Activity className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Trades Needed</h3>
                  <p className="text-3xl font-bold text-blue-400 mb-1">{planData.tradesToPass || 0}</p>
                  <p className="text-xs text-gray-400">Estimated trades</p>
                </div>
              </div>

              {/* Days to Pass */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm border border-purple-500/40 rounded-xl p-6 text-center hover:border-purple-400/60 transition-all duration-300">
                  <div className="flex items-center justify-center mb-3">
                    <Clock className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Days to Pass</h3>
                  <p className="text-3xl font-bold text-purple-400 mb-1">{planData.estimatedDaysToPass || 0}</p>
                  <p className="text-xs text-gray-400">Trading days</p>
                </div>
              </div>

              {/* Win Rate Needed */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm border border-orange-500/40 rounded-xl p-6 text-center hover:border-orange-400/60 transition-all duration-300">
                  <div className="flex items-center justify-center mb-3">
                    <TrendingUp className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Win Rate Needed</h3>
                  <p className="text-3xl font-bold text-orange-400 mb-1">
                    {planData.profitTarget && planData.profitAmount && planData.tradesToPass ? 
                      Math.ceil((planData.profitTarget / (planData.profitAmount * planData.tradesToPass)) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-400">Minimum accuracy</p>
                </div>
              </div>
            </div>

            {/* Additional Risk Metrics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Drawdown Limit */}
              <div className="bg-gray-800/60 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Max Drawdown</span>
                </div>
                <p className="text-xl font-bold text-red-400">{((planData.accountSize || 0) * 0.05).toFixed(0)}</p>
                <p className="text-xs text-gray-400">5% of account size</p>
              </div>

              {/* Position Size */}
              <div className="bg-gray-800/60 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Position Size</span>
                </div>
                <p className="text-xl font-bold text-yellow-400">{positionSizeInUnits.toFixed(0)}</p>
                <p className="text-xs text-gray-400">Units per trade</p>
              </div>

              {/* Success Rate */}
              <div className="bg-gray-800/60 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Success Probability</span>
                </div>
                <p className="text-xl font-bold text-green-400">
                  {planData.riskRewardRatio && planData.riskRewardRatio >= 2 ? '85%' : '65%'}
                </p>
                <p className="text-xs text-gray-400">Based on R:R ratio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Assets - Futuristic Design */}
        {((planData.cryptoAssets && planData.cryptoAssets.length > 0) || (planData.forexAssets && planData.forexAssets.length > 0)) && (
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-green-600 to-blue-600 rounded-3xl blur opacity-20"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Trading Arsenal
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {planData.cryptoAssets && planData.cryptoAssets.length > 0 && (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                    <div className="relative bg-gray-800/80 backdrop-blur-sm border border-yellow-500/40 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Crypto Assets ({planData.cryptoAssets?.length || 0})
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {planData.cryptoAssets.map((asset: string) => (
                          <div key={asset} className="relative group/asset">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg blur opacity-40 group-hover/asset:opacity-70 transition duration-200"></div>
                            <span className="relative bg-gray-900/90 text-yellow-400 px-4 py-2 rounded-lg text-sm font-medium border border-yellow-500/30 hover:border-yellow-400/60 transition-all duration-200">
                              {asset}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {planData.forexAssets && planData.forexAssets.length > 0 && (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                    <div className="relative bg-gray-800/80 backdrop-blur-sm border border-green-500/40 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Forex Pairs ({planData.forexAssets?.length || 0})
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {planData.forexAssets.map((pair: string) => (
                          <div key={pair} className="relative group/pair">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg blur opacity-40 group-hover/pair:opacity-70 transition duration-200"></div>
                            <span className="relative bg-gray-900/90 text-green-400 px-4 py-2 rounded-lg text-sm font-medium border border-green-500/30 hover:border-green-400/60 transition-all duration-200">
                              {pair}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Session Recommendation - Enhanced */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl blur opacity-20"></div>
          <div className="relative bg-gray-900/90 backdrop-blur-sm border border-indigo-500/30 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-600/20 to-blue-600/20 border border-indigo-500/30">
                <Clock className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Optimal Trading Session
              </h2>
            </div>
            <div className="bg-gradient-to-r from-indigo-600/10 to-blue-600/10 border border-indigo-500/40 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-indigo-300 text-lg leading-relaxed">{planData.sessionRecommendation}</p>
            </div>
          </div>
        </div>

        {/* Trade Execution Matrix - Futuristic Table */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl blur opacity-20"></div>
          <div className="relative bg-gray-900/90 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Execution Matrix Protocol
              </h2>
            </div>
            
            <div className="overflow-x-auto futuristic-scrollbar">
              <div className="min-w-full bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="grid grid-cols-5 bg-gradient-to-r from-gray-800 to-gray-700 text-white font-semibold">
                  <div className="p-4 border-r border-gray-600/50">Trade #</div>
                  <div className="p-4 border-r border-gray-600/50">Risk Amount</div>
                  <div className="p-4 border-r border-gray-600/50">Profit Target</div>
                  <div className="p-4 border-r border-gray-600/50">Cumulative</div>
                  <div className="p-4">Progress</div>
                </div>
                
                <div className="divide-y divide-gray-700/30">
                  {planData.tradeByTradePlan && planData.tradeByTradePlan.slice(0, 15).map((trade: any, i: number) => {
                    const cumulativeProfit = trade.balance + trade.profitTarget - planData.accountSize;
                    const progressPercentage = planData.profitTarget ? (cumulativeProfit / planData.profitTarget) * 100 : 0;
                    return (
                      <div key={i} className="grid grid-cols-5 hover:bg-gray-700/30 transition-all duration-200 group">
                        <div className="p-4 border-r border-gray-700/30 text-gray-300 group-hover:text-white">
                          Trade {trade.trade}
                        </div>
                        <div className="p-4 border-r border-gray-700/30 text-red-400 font-bold">
                          ${trade.riskAmount.toFixed(2)}
                        </div>
                        <div className="p-4 border-r border-gray-700/30 text-green-400 font-bold">
                          ${trade.profitTarget.toFixed(2)}
                        </div>
                        <div className="p-4 border-r border-gray-700/30 text-cyan-400 font-bold">
                          ${cumulativeProfit.toFixed(2)}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-400 font-medium min-w-[40px]">
                              {progressPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(tradesToPass || 0) > 15 && (
                    <div className="grid grid-cols-5 bg-gray-800/40">
                      <div className="col-span-5 p-6 text-center text-gray-400 italic">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                          <span>... and {(tradesToPass || 0) - 15} more trades to reach your target</span>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compounding Method Section */}
        <div className="mt-12 mb-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Compounding Strategy
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Risk Method</label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 bg-gray-800/60 rounded-lg border border-gray-600 hover:border-purple-500/50 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        value="flat"
                        checked={compoundingMethod === 'flat'}
                        onChange={(e) => setCompoundingMethod(e.target.value as 'flat' | 'compounding')}
                        className="mr-3 text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-gray-200 font-medium">Flat Risk</span>
                        <p className="text-xs text-gray-400">Fixed $ amount per trade</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 bg-gray-800/60 rounded-lg border border-gray-600 hover:border-purple-500/50 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        value="compounding"
                        checked={compoundingMethod === 'compounding'}
                        onChange={(e) => setCompoundingMethod(e.target.value as 'flat' | 'compounding')}
                        className="mr-3 text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-gray-200 font-medium">Compounding</span>
                        <p className="text-xs text-gray-400">Risk grows with account balance</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Method Comparison</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Flat Risk:</span>
                      <span className="text-gray-200">${((planData.accountSize || 0) * ((planData.riskPercentage || 1) / 100)).toFixed(2)} per trade</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Compounding:</span>
                      <span className="text-gray-200">Variable based on current balance</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Growth Potential:</span>
                      <span className="text-gray-200">{compoundingMethod === 'compounding' ? 'Higher' : 'Lower'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Projection Section */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Estimated Earnings Projection
                  </h2>
                </div>
                <button
                  onClick={() => setShowEarningsProjection(!showEarningsProjection)}
                  className="px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 rounded-lg transition-colors"
                >
                  {showEarningsProjection ? 'Hide' : 'Show'} Projection
                </button>
              </div>
              
              {showEarningsProjection && (
                <div className="space-y-6">
                  <p className="text-gray-300 text-sm">
                    Projected earnings over 30 trading days based on your account size (${(planData.accountSize || 0).toLocaleString()}) 
                    and risk percentage ({planData.riskPercentage || 1}%) using {compoundingMethod} risk method.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[50, 60, 70, 80, 90].map((winRate) => {
                      const projectedEarnings = calculateProjectedEarnings(winRate, compoundingMethod);
                      return (
                        <div key={winRate} className="bg-gray-800/60 border border-gray-600 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-400 mb-1">{winRate}%</div>
                          <div className="text-sm text-gray-400 mb-2">Win Rate</div>
                          <div className="text-lg font-semibold text-white">
                            ${projectedEarnings.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Projected</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="bg-gray-800/40 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Calculation Details</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>• Base Risk per Trade: ${((planData.accountSize || 0) * ((planData.riskPercentage || 1) / 100)).toFixed(2)}</div>
                      <div>• Risk/Reward Ratio: 1:{planData.riskRewardRatio || 2}</div>
                      <div>• Trading Days: 30</div>
                      <div>• Method: {compoundingMethod === 'compounding' ? 'Compounding (risk grows with balance)' : 'Flat Risk (fixed amount)'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button - Futuristic */}
        <div className="text-center mt-12">
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-50"></div>
            {user?.membershipTier === 'kickstarter' ? (
              <button
                onClick={() => navigate('/upload-screenshot')}
                className="relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 border border-green-500/30 shadow-lg shadow-green-500/25"
              >
                <span className="flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  Proceed to Upload Screenshot
                  <Shield className="w-5 h-5" />
                </span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  try {
                    console.log('Attempting to navigate to dashboard...');
                    
                    // Save plan if needed
                    if (fromQuestionnaire && currentPlan) {
                      console.log('Saving plan before navigation...');
                      await savePlanToBackend(currentPlan);
                    }
                    
                    // First try programmatic navigation
                    console.log('Attempting programmatic navigation to /dashboard');
                    navigate('/dashboard', { 
                      replace: true,
                      state: { from: 'risk-management-plan' }
                    });
                    
                    // Fallback to window.location if navigation doesn't happen
                    const fallbackTimer = setTimeout(() => {
                      console.log('Fallback: Using window.location');
                      window.location.href = '/dashboard';
                    }, 500);
                    
                    // Cleanup timer if navigation succeeds
                    window.addEventListener('beforeunload', () => clearTimeout(fallbackTimer));
                    
                  } catch (error) {
                    console.error('Navigation error:', error);
                    // Fallback to window.location on error
                    window.location.href = '/dashboard';
                  }
                }}
                className="relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 border border-green-500/30 shadow-lg shadow-green-500/25"
              >
                <span className="flex items-center gap-3">
                  <Brain className="w-5 h-5" />
                  {fromQuestionnaire ? 'Save Plan & Go to Dashboard' : 'Proceed to Dashboard'}
                  <Target className="w-5 h-5" />
                </span>
              </button>
            )}
          </div>
        </div>
        
        </div>
      </div>
    </div>
  );
};

export default RiskManagementPlan;
