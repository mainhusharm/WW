import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

interface DatabaseUserData {
  id: number;
  uuid: string;
  username: string;
  email: string;
  plan_type: string;
  payment_status: string;
  first_name: string;
  last_name: string;
  phone: string;
  company: string;
  country: string;
  trading_experience: string;
  trading_goals: string;
  risk_tolerance: string;
  preferred_markets: string;
  trading_style: string;
  account_type: string;
  prop_firm: string;
  account_size: number;
  account_equity: number;
  account_currency: string;
  broker_name: string;
  broker_platform: string;
  risk_percentage: number;
  risk_reward_ratio: string;
  max_daily_loss_percentage: number;
  max_weekly_loss_percentage: number;
  max_monthly_loss_percentage: number;
  payment_method: string;
  payment_amount: number;
  payment_date: string;
  transaction_id: string;
  currency: string;
  billing_country: string;
  billing_state: string;
  billing_city: string;
  billing_address: string;
  company_name: string;
  account_balance: number;
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  max_drawdown: number;
  current_drawdown: number;
  consecutive_wins: number;
  consecutive_losses: number;
  average_win: number;
  average_loss: number;
  profit_factor: number;
  gross_profit: number;
  gross_loss: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  prop_firm_rules: any;
  rule_violations: any[];
  compliance_status: string;
  questionnaire_data: any;
  data_capture_complete: boolean;
  agree_to_marketing: boolean;
  unique_id: string;
  created_at: string;
  updated_at: string;
  last_active: string;
}

interface DashboardData {
  userProfile: {
    propFirm: string;
    accountType: string;
    experience: string;
    accountSize: number | string;
    uniqueId: string;
    riskTolerance: string;
    tradingStyle: string;
    preferredMarkets: string;
    brokerName: string;
    brokerPlatform: string;
  };
  performance: {
    accountBalance: number | string;
    totalPnl: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    maxDrawdown: number;
    currentDrawdown: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    grossProfit: number;
    grossLoss: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
  };
  riskProtocol: {
    maxDailyRisk: number;
    riskPerTrade: number;
    maxDrawdown: number;
    riskPercentage: number;
    riskRewardRatio: string;
    maxDailyLossPercentage: number;
    maxWeeklyLossPercentage: number;
    maxMonthlyLossPercentage: number;
  };
  payment: {
    planType: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentAmount: number;
    paymentDate: string;
    currency: string;
  };
  questionnaire: any;
}

export const useDatabaseData = () => {
  const { user, userProfile } = useSupabaseAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user data from backend
        const response = await fetch(`/api/users/${user.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch user data');
        }

        const userData: DatabaseUserData = result.user;
        
        // Transform database data to dashboard format
        const transformedData: DashboardData = {
          userProfile: {
            propFirm: userData.prop_firm || 'Not Set',
            accountType: userData.account_type || 'Not Set',
            experience: userData.trading_experience || 'Not Set',
            accountSize: userData.account_size || userData.account_equity || 'Not Set',
            uniqueId: userData.unique_id || 'Not Set',
            riskTolerance: userData.risk_tolerance || 'Not Set',
            tradingStyle: userData.trading_style || 'Not Set',
            preferredMarkets: userData.preferred_markets || 'Not Set',
            brokerName: userData.broker_name || 'Not Set',
            brokerPlatform: userData.broker_platform || 'Not Set',
          },
          performance: {
            accountBalance: userData.account_balance || userData.account_size || 'Not Set',
            totalPnl: userData.total_pnl || 0,
            winRate: userData.win_rate || 0,
            totalTrades: userData.total_trades || 0,
            winningTrades: userData.winning_trades || 0,
            losingTrades: userData.losing_trades || 0,
            maxDrawdown: userData.max_drawdown || 0,
            currentDrawdown: userData.current_drawdown || 0,
            consecutiveWins: userData.consecutive_wins || 0,
            consecutiveLosses: userData.consecutive_losses || 0,
            averageWin: userData.average_win || 0,
            averageLoss: userData.average_loss || 0,
            profitFactor: userData.profit_factor || 0,
            grossProfit: userData.gross_profit || 0,
            grossLoss: userData.gross_loss || 0,
            sharpeRatio: userData.sharpe_ratio || 0,
            sortinoRatio: userData.sortino_ratio || 0,
            calmarRatio: userData.calmar_ratio || 0,
          },
          riskProtocol: {
            maxDailyRisk: userData.max_daily_loss_percentage || 0,
            riskPerTrade: userData.risk_percentage || 0,
            maxDrawdown: userData.max_drawdown || 0,
            riskPercentage: userData.risk_percentage || 0,
            riskRewardRatio: userData.risk_reward_ratio || 'Not Set',
            maxDailyLossPercentage: userData.max_daily_loss_percentage || 0,
            maxWeeklyLossPercentage: userData.max_weekly_loss_percentage || 0,
            maxMonthlyLossPercentage: userData.max_monthly_loss_percentage || 0,
          },
          payment: {
            planType: userData.plan_type || 'free',
            paymentStatus: userData.payment_status || 'pending',
            paymentMethod: userData.payment_method || 'Not Set',
            paymentAmount: userData.payment_amount || 0,
            paymentDate: userData.payment_date || 'Not Set',
            currency: userData.currency || 'USD',
          },
          questionnaire: userData.questionnaire_data || {},
        };

        console.log('Dashboard data loaded from database:', transformedData);
        setDashboardData(transformedData);
      } catch (err) {
        console.error('Error fetching user data from database:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback to localStorage if database fails
        const fallbackData = localStorage.getItem('questionnaireAnswers');
        if (fallbackData) {
          try {
            const questionnaireData = JSON.parse(fallbackData);
            const fallbackDashboardData: DashboardData = {
              userProfile: {
                propFirm: questionnaireData.propFirm || 'Not Set',
                accountType: questionnaireData.accountType || 'Not Set',
                experience: questionnaireData.experience || 'Not Set',
                accountSize: questionnaireData.accountSize || 'Not Set',
                uniqueId: userProfile?.unique_id || 'Not Set',
                riskTolerance: questionnaireData.riskTolerance || 'Not Set',
                tradingStyle: questionnaireData.tradingStyle || 'Not Set',
                preferredMarkets: questionnaireData.preferredMarkets || 'Not Set',
                brokerName: 'Not Set',
                brokerPlatform: 'Not Set',
              },
              performance: {
                accountBalance: questionnaireData.accountSize || 'Not Set',
                totalPnl: 0,
                winRate: 0,
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                maxDrawdown: 0,
                currentDrawdown: 0,
                consecutiveWins: 0,
                consecutiveLosses: 0,
                averageWin: 0,
                averageLoss: 0,
                profitFactor: 0,
                grossProfit: 0,
                grossLoss: 0,
                sharpeRatio: 0,
                sortinoRatio: 0,
                calmarRatio: 0,
              },
              riskProtocol: {
                maxDailyRisk: 0,
                riskPerTrade: 0,
                maxDrawdown: 0,
                riskPercentage: 0,
                riskRewardRatio: 'Not Set',
                maxDailyLossPercentage: 0,
                maxWeeklyLossPercentage: 0,
                maxMonthlyLossPercentage: 0,
              },
              payment: {
                planType: 'free',
                paymentStatus: 'pending',
                paymentMethod: 'Not Set',
                paymentAmount: 0,
                paymentDate: 'Not Set',
                currency: 'USD',
              },
              questionnaire: questionnaireData,
            };
            setDashboardData(fallbackDashboardData);
          } catch (parseError) {
            console.error('Error parsing fallback data:', parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  return { dashboardData, loading, error };
};
