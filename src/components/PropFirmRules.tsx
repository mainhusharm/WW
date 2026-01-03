import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Target, Clock, DollarSign, TrendingUp, TrendingDown, CheckCircle, XCircle, Info } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import './FuturisticPropFirmRules.css';
import { propFirms } from '../data/propFirms';

interface PropFirmRulesProps {
  dashboardData?: any;
}

const PropFirmRules: React.FC<PropFirmRulesProps> = ({ dashboardData }) => {
  const { user } = useUser();
  const { propFirm, accountConfig } = useTradingPlan();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [_, setForceUpdate] = useState(0);
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false);
  const [selectedPropFirm, setSelectedPropFirm] = useState<any>(null);
  const [apiRules, setApiRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setForceUpdate(fu => fu + 1);
    const questionnaireCompleted = localStorage.getItem('questionnaire_completed');
    setIsQuestionnaireCompleted(questionnaireCompleted === 'true');

    if (questionnaireCompleted === 'true') {
      const answers = JSON.parse(localStorage.getItem('questionnaireAnswers') || '{}');
      console.log('Questionnaire answers:', answers);
      
      // Find the prop firm from the answers
      const firm = propFirms.find(f => f.name === answers.propFirm);
      setSelectedPropFirm(firm);
      
      // Use the accountType from questionnaire answers, not propFirm
      const accountType = answers.accountType || answers.propFirm || 'QuantTekel Instant';
      console.log('Fetching rules for account type:', accountType);
      
      // Fetch rules from API using the correct account type
      fetchPropFirmRules(accountType);
    } else {
      setLoading(false);
    }
  }, [selectedCategory]);

  const fetchPropFirmRules = async (accountType: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://backend-8j0e.onrender.com/api/test/prop-firm-rules?accountType=${encodeURIComponent(accountType)}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setApiRules(data.rules);
      } else {
        console.error('Failed to fetch prop firm rules:', data.error);
      }
    } catch (error) {
      console.error('Error fetching prop firm rules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use API rules if available, otherwise fallback to selectedPropFirm or context
  const propFirmData = apiRules || selectedPropFirm || dashboardData?.propFirmRules || propFirm;
  const userProfile = dashboardData?.userProfile;
  
  // Get the current prop firm name and account type from questionnaire
  const questionnaireAnswers = localStorage.getItem('questionnaireAnswers');
  let currentPropFirmName = 'Unknown Prop Firm';
  let currentAccountType = 'Challenge';
  
  if (questionnaireAnswers) {
    try {
      const answers = JSON.parse(questionnaireAnswers);
      currentPropFirmName = answers.propFirm || 'Unknown Prop Firm';
      currentAccountType = answers.accountType || 'Challenge';
    } catch (error) {
      console.error('Error parsing questionnaire answers:', error);
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Loading Prop Firm Rules...</h3>
          <p className="text-gray-400">Fetching the latest rules from the server.</p>
        </div>
      </div>
    );
  }

  if (!isQuestionnaireCompleted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Questionnaire Not Completed</h3>
          <p className="text-gray-400">
            Please complete the questionnaire to see your prop firm rules.
          </p>
          <Link to="/questionnaire">
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300">
              Go to Questionnaire
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!propFirmData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Prop Firm Not Selected</h3>
          <p className="text-gray-400">Please select a prop firm in the questionnaire.</p>
          <Link to="/questionnaire">
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300">
              Go to Questionnaire
            </button>
          </Link>
        </div>
      </div>
    );
  }


  const currentAccountSize = (userProfile as any)?.accountSize || accountConfig?.size || 10000;


  const ruleCategories = [
    { id: 'all', label: 'All Rules', icon: <Shield className="w-4 h-4" /> },
    { id: 'risk', label: 'Risk Management', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'profit', label: 'Profit Targets', icon: <Target className="w-4 h-4" /> },
    { id: 'time', label: 'Time Limits', icon: <Clock className="w-4 h-4" /> },
    { id: 'trading', label: 'Trading Rules', icon: <TrendingUp className="w-4 h-4" /> }
  ];


  const rules = [
    {
      id: 'daily-loss',
      category: 'risk',
      title: 'Daily Loss Limit',
      description: 'Maximum loss allowed in a single trading day',
      value: propFirmData?.dailyLossLimit || 'Not Set',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      id: 'max-drawdown',
      category: 'risk',
      title: 'Maximum Drawdown',
      description: 'Maximum total loss from the highest equity peak',
      value: propFirmData?.maxDrawdown || 'Not Set',
      icon: <TrendingDown className="w-5 h-5" />,
    },
    {
      id: 'profit-target',
      category: 'profit',
      title: 'Profit Target',
      description: 'Required profit to pass the challenge phase',
      value: propFirmData?.profitTarget || 'Not Set',
      icon: <Target className="w-5 h-5" />,
    },
    {
      id: 'min-trading-days',
      category: 'time',
      title: 'Minimum Trading Days',
      description: 'Minimum number of days you must trade',
      value: propFirmData?.minTradingDays || 'Not Set',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: 'overnight-positions',
      category: 'trading',
      title: 'Weekend Holding',
      description: 'Holding positions over the weekend',
      value: propFirmData?.weekendHolding || 'Not Set',
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      id: 'news-trading',
      category: 'trading',
      title: 'News Trading',
      description: 'Trading during high-impact news events',
      value: propFirmData?.newsTrading || 'Not Set',
      icon: <XCircle className="w-5 h-5" />,
    },
  ];


  const filteredRules = selectedCategory === 'all'
    ? rules 
    : rules.filter(rule => rule.category === selectedCategory);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'danger':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };


  return (
    <div className="prop-firm-rules-container">
      <div className="prop-firm-rules-header">
        <h1 className="prop-firm-rules-title">{currentPropFirmName} Rules</h1>
        <p className="prop-firm-rules-subtitle">
          Account Size: ${currentAccountSize.toLocaleString()} • Account Type: {currentAccountType}
        </p>
      </div>

      <div className="rules-grid">
        {filteredRules.map(rule => (
          <div key={rule.id} className="rule-card-futuristic">
            <div className="rule-card-header">
              <div className="rule-card-icon">
                {rule.icon}
              </div>
              <h3 className="rule-card-title">{rule.title}</h3>
            </div>
            <p className="rule-card-description">{rule.description}</p>
            <div className="rule-card-value">{rule.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default PropFirmRules;
