import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle, 
  BarChart3, 
  Activity, 
  Zap,
  Brain,
  Shield,
  Clock,
  Award,
  PieChart,
  LineChart as LineChartIcon,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart,
  ReferenceLine
} from 'recharts';

interface Trade {
  id: string;
  signalId: string;
  pair: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskAmount: number;
  rewardAmount: number;
  status: 'open' | 'closed';
  entryTime: Date;
  closeTime?: Date;
  outcome?: 'win' | 'loss' | 'breakeven';
  pnl?: number;
  equityBefore: number;
  equityAfter?: number;
  notes?: string;
}

interface PerformanceMetrics {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  currentDrawdown: number;
  grossProfit: number;
  grossLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  recoveryFactor: number;
  expectancy: number;
  kellyPercentage: number;
  var95: number;
  cvar95: number;
  hitRate: number;
  averageHoldingPeriod: number;
  bestTrade: number;
  worstTrade: number;
  largestWin: number;
  largestLoss: number;
  averageWinLossRatio: number;
  totalFees: number;
  netProfit: number;
  returnOnInvestment: number;
  compoundAnnualGrowthRate: number;
  volatility: number;
  beta: number;
  alpha: number;
  informationRatio: number;
  treynorRatio: number;
  jensenAlpha: number;
  trackingError: number;
  maximumAdverseExcursion: number;
  maximumFavorableExcursion: number;
  profitTargetHitRate: number;
  stopLossHitRate: number;
  riskRewardRatio: number;
  averageRiskReward: number;
  winStreak: number;
  lossStreak: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  monthlyReturns: number[];
  dailyReturns: number[];
  equityCurve: Array<{date: string, equity: number, drawdown: number}>;
  monthlyPnL: Array<{month: string, pnl: number, trades: number}>;
  winLossDistribution: Array<{range: string, count: number}>;
  timeOfDayPerformance: Array<{hour: number, pnl: number, trades: number}>;
  dayOfWeekPerformance: Array<{day: string, pnl: number, trades: number}>;
  symbolPerformance: Array<{symbol: string, pnl: number, trades: number, winRate: number}>;
}

interface EnhancedPerformanceAnalyticsProps {
  userTrades: Trade[];
  currentAccountData: {
    accountBalance: number;
    totalPnl: number;
    winRate: number;
    totalTrades: number;
  };
  performanceMetrics: PerformanceMetrics;
  className?: string;
  // Real-time update triggers
  lastTradeUpdate?: Date;
  lastBalanceUpdate?: Date;
  isRealTimeEnabled?: boolean;
}

const EnhancedPerformanceAnalytics: React.FC<EnhancedPerformanceAnalyticsProps> = ({
  userTrades,
  currentAccountData,
  performanceMetrics,
  className = '',
  lastTradeUpdate,
  lastBalanceUpdate,
  isRealTimeEnabled = true
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedChart, setSelectedChart] = useState('equity');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);

  // Advanced mathematical calculations
  const advancedMetrics = useMemo(() => {
    if (!userTrades.length) return null;

    const trades = userTrades;
    const returns = trades.map(trade => trade.pnl || 0);
    const positiveReturns = returns.filter(r => r > 0);
    const negativeReturns = returns.filter(r => r < 0);
    
    // Basic metrics
    const totalPnl = returns.reduce((sum, r) => sum + r, 0);
    const totalTrades = trades.length;
    const winningTrades = positiveReturns.length;
    const losingTrades = negativeReturns.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    // Profit/Loss metrics
    const grossProfit = positiveReturns.reduce((sum, r) => sum + r, 0);
    const grossLoss = Math.abs(negativeReturns.reduce((sum, r) => sum + r, 0));
    const netProfit = grossProfit - grossLoss;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    // Average metrics
    const averageWin = positiveReturns.length > 0 ? grossProfit / positiveReturns.length : 0;
    const averageLoss = negativeReturns.length > 0 ? grossLoss / negativeReturns.length : 0;
    const averageWinLossRatio = averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? Infinity : 0;
    
    // Risk metrics
    const equityCurve = trades.reduce((acc, trade, index) => {
      const previousEquity = acc.length > 0 ? acc[acc.length - 1].equity : currentAccountData.accountBalance;
      const newEquity = previousEquity + (trade.pnl || 0);
      const peak = Math.max(...acc.map(p => p.equity), currentAccountData.accountBalance);
      const drawdown = ((peak - newEquity) / peak) * 100;
      
      acc.push({
        date: (trade.closeTime || trade.entryTime).toISOString().split('T')[0],
        equity: newEquity,
        drawdown: drawdown
      });
      return acc;
    }, [] as Array<{date: string, equity: number, drawdown: number}>);
    
    const maxDrawdown = Math.max(...equityCurve.map(p => p.drawdown), 0);
    const currentDrawdown = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].drawdown : 0;
    
    // Volatility and risk-adjusted returns
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    const sharpeRatio = volatility > 0 ? meanReturn / volatility : 0;
    
    // Downside deviation for Sortino ratio
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVariance = downsideReturns.length > 0 
      ? downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length 
      : 0;
    const downsideDeviation = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideDeviation > 0 ? meanReturn / downsideDeviation : 0;
    
    // Calmar ratio
    const calmarRatio = maxDrawdown > 0 ? (totalPnl / currentAccountData.accountBalance) / (maxDrawdown / 100) : 0;
    
    // Recovery factor
    const recoveryFactor = maxDrawdown > 0 ? totalPnl / (maxDrawdown / 100 * currentAccountData.accountBalance) : 0;
    
    // Expectancy
    const expectancy = (winRate / 100) * averageWin - ((100 - winRate) / 100) * averageLoss;
    
    // Kelly percentage
    const kellyPercentage = averageLoss > 0 ? ((winRate / 100) * averageWin - ((100 - winRate) / 100) * averageLoss) / averageWin : 0;
    
    // Value at Risk (95%)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var95 = sortedReturns[var95Index] || 0;
    
    // Conditional Value at Risk (95%)
    const cvar95 = var95Index > 0 
      ? sortedReturns.slice(0, var95Index).reduce((sum, r) => sum + r, 0) / var95Index 
      : 0;
    
    // Hit rate
    const hitRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    // Average holding period
    const totalHoldingTime = trades.reduce((sum, trade) => {
      const exitTime = trade.closeTime || new Date();
      return sum + (exitTime.getTime() - trade.entryTime.getTime());
    }, 0);
    const averageHoldingPeriod = totalTrades > 0 ? totalHoldingTime / totalTrades / (1000 * 60 * 60 * 24) : 0; // in days
    
    // Best and worst trades
    const bestTrade = Math.max(...returns);
    const worstTrade = Math.min(...returns);
    const largestWin = Math.max(...positiveReturns, 0);
    const largestLoss = Math.min(...negativeReturns, 0);
    
    // Streaks
    let currentStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    for (let i = 0; i < returns.length; i++) {
      if (returns[i] > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
      } else if (returns[i] < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
      }
    }
    
    currentStreak = returns[returns.length - 1] > 0 ? currentWinStreak : -currentLossStreak;
    
    // Monthly analysis
    const monthlyData = trades.reduce((acc, trade) => {
      const exitTime = trade.closeTime || trade.entryTime;
      const month = exitTime.toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { pnl: 0, trades: 0 };
      }
      acc[month].pnl += (trade.pnl || 0);
      acc[month].trades += 1;
      return acc;
    }, {} as Record<string, {pnl: number, trades: number}>);
    
    const monthlyPnL = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      pnl: data.pnl,
      trades: data.trades
    })).sort((a, b) => a.month.localeCompare(b.month));
    
    // Time of day analysis
    const timeOfDayData = trades.reduce((acc, trade) => {
      const hour = trade.entryTime.getHours();
      if (!acc[hour]) {
        acc[hour] = { pnl: 0, trades: 0 };
      }
      acc[hour].pnl += trade.pnl;
      acc[hour].trades += 1;
      return acc;
    }, {} as Record<number, {pnl: number, trades: number}>);
    
    const timeOfDayPerformance = Array.from({length: 24}, (_, hour) => ({
      hour,
      pnl: timeOfDayData[hour]?.pnl || 0,
      trades: timeOfDayData[hour]?.trades || 0
    }));
    
    // Day of week analysis
    const dayOfWeekData = trades.reduce((acc, trade) => {
      const day = trade.entryTime.toLocaleDateString('en-US', { weekday: 'long' });
      if (!acc[day]) {
        acc[day] = { pnl: 0, trades: 0 };
      }
      acc[day].pnl += trade.pnl;
      acc[day].trades += 1;
      return acc;
    }, {} as Record<string, {pnl: number, trades: number}>);
    
    const dayOfWeekPerformance = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      .map(day => ({
        day,
        pnl: dayOfWeekData[day]?.pnl || 0,
        trades: dayOfWeekData[day]?.trades || 0
      }));
    
    // Symbol performance
    const symbolData = trades.reduce((acc, trade) => {
      if (!acc[trade.pair]) {
        acc[trade.pair] = { pnl: 0, trades: 0, wins: 0 };
      }
      acc[trade.pair].pnl += (trade.pnl || 0);
      acc[trade.pair].trades += 1;
      if ((trade.pnl || 0) > 0) acc[trade.pair].wins += 1;
      return acc;
    }, {} as Record<string, {pnl: number, trades: number, wins: number}>);
    
    const symbolPerformance = Object.entries(symbolData).map(([symbol, data]) => ({
      symbol,
      pnl: data.pnl,
      trades: data.trades,
      winRate: (data.wins / data.trades) * 100
    })).sort((a, b) => b.pnl - a.pnl);
    
    // Win/Loss distribution
    const winLossRanges = [
      { min: -Infinity, max: -1000, label: '< -$1000' },
      { min: -1000, max: -500, label: '-$1000 to -$500' },
      { min: -500, max: -100, label: '-$500 to -$100' },
      { min: -100, max: 0, label: '-$100 to $0' },
      { min: 0, max: 100, label: '$0 to $100' },
      { min: 100, max: 500, label: '$100 to $500' },
      { min: 500, max: 1000, label: '$500 to $1000' },
      { min: 1000, max: Infinity, label: '> $1000' }
    ];
    
    const winLossDistribution = winLossRanges.map(range => ({
      range: range.label,
      count: returns.filter(r => r >= range.min && r < range.max).length
    }));
    
    return {
      totalPnl,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      grossProfit,
      grossLoss,
      netProfit,
      profitFactor,
      averageWin,
      averageLoss,
      averageWinLossRatio,
      maxDrawdown,
      currentDrawdown,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      recoveryFactor,
      expectancy,
      kellyPercentage,
      var95,
      cvar95,
      hitRate,
      averageHoldingPeriod,
      bestTrade,
      worstTrade,
      largestWin,
      largestLoss,
      volatility,
      currentStreak,
      longestWinStreak,
      longestLossStreak,
      equityCurve,
      monthlyPnL,
      timeOfDayPerformance,
      dayOfWeekPerformance,
      symbolPerformance,
      winLossDistribution
    };
  }, [userTrades, currentAccountData]);

  const chartData = useMemo(() => {
    if (!advancedMetrics) return [];
    
    switch (selectedChart) {
      case 'equity':
        return advancedMetrics.equityCurve.map((point, index) => ({
          ...point,
          index,
          date: new Date(point.date).toLocaleDateString()
        }));
      case 'monthly':
        return advancedMetrics.monthlyPnL;
      case 'timeOfDay':
        return advancedMetrics.timeOfDayPerformance;
      case 'dayOfWeek':
        return advancedMetrics.dayOfWeekPerformance;
      case 'symbols':
        return advancedMetrics.symbolPerformance.slice(0, 10);
      case 'distribution':
        return advancedMetrics.winLossDistribution;
      default:
        return advancedMetrics.equityCurve;
    }
  }, [advancedMetrics, selectedChart]);

  // Real-time update effects
  useEffect(() => {
    if (!isRealTimeEnabled || !isRealTimeActive) return;

    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
      setAnimationKey(prev => prev + 1);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, isRealTimeActive]);

  // Detect changes in account data and trigger updates
  useEffect(() => {
    if (lastTradeUpdate || lastBalanceUpdate) {
      setLastUpdateTime(new Date());
      setAnimationKey(prev => prev + 1);
      
      // Trigger a brief loading state for visual feedback
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [lastTradeUpdate, lastBalanceUpdate]);

  // Auto-refresh when userTrades or currentAccountData changes
  useEffect(() => {
    if (isRealTimeActive) {
      setLastUpdateTime(new Date());
      setAnimationKey(prev => prev + 1);
    }
  }, [userTrades.length, currentAccountData.totalPnl, currentAccountData.winRate, currentAccountData.totalTrades, isRealTimeActive]);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
    setLastUpdateTime(new Date());
    setAnimationKey(prev => prev + 1);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const toggleRealTime = () => {
    setIsRealTimeActive(prev => !prev);
    if (!isRealTimeActive) {
      setLastUpdateTime(new Date());
      setAnimationKey(prev => prev + 1);
    }
  };

  const handleExport = () => {
    if (!advancedMetrics) return;
    
    const data = {
      summary: {
        totalPnl: advancedMetrics.totalPnl,
        winRate: advancedMetrics.winRate,
        totalTrades: advancedMetrics.totalTrades,
        profitFactor: advancedMetrics.profitFactor,
        sharpeRatio: advancedMetrics.sharpeRatio,
        maxDrawdown: advancedMetrics.maxDrawdown
      },
      detailed: advancedMetrics,
      trades: userTrades
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!advancedMetrics) {
    return (
      <div className={`bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 ${className}`}>
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <BarChart3 className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Trading Data Available</h3>
          <p className="text-gray-400 mb-6">Start trading to see your performance analytics</p>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Performance Analytics</h2>
            <p className="text-gray-400">Advanced trading performance insights</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Real-time status indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-400">
              {isRealTimeActive ? 'Live' : 'Paused'}
            </span>
          </div>
          
          <button
            onClick={toggleRealTime}
            className={`p-2 rounded-lg transition-colors ${
              isRealTimeActive 
                ? 'bg-green-800 hover:bg-green-700 text-green-300' 
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            title={isRealTimeActive ? 'Pause real-time updates' : 'Resume real-time updates'}
          >
            <Activity className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleExport}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title="Export analytics data"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-2 mb-8">
        <Filter className="w-5 h-5 text-gray-400" />
        <span className="text-gray-400">Period:</span>
        {['7d', '30d', '90d', '1y', 'all'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPeriod === period
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {period.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total P&L */}
        <div 
          key={`pnl-${animationKey}`}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 transition-all duration-500 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full transition-all duration-300 ${
              advancedMetrics.totalPnl >= 0 
                ? 'bg-green-900 text-green-300' 
                : 'bg-red-900 text-red-300'
            }`}>
              {advancedMetrics.totalPnl >= 0 ? '+' : ''}${advancedMetrics.totalPnl.toFixed(2)}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">Total P&L</h3>
          <p className="text-gray-400 text-sm">Net profit/loss</p>
          {isRealTimeActive && (
            <div className="mt-2 text-xs text-cyan-400 flex items-center">
              <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
              Live updates
            </div>
          )}
        </div>

        {/* Win Rate */}
        <div 
          key={`winrate-${animationKey}`}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 transition-all duration-500 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-900 text-blue-300 transition-all duration-300">
              {advancedMetrics.winRate.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">Win Rate</h3>
          <p className="text-gray-400 text-sm">{advancedMetrics.winningTrades}/{advancedMetrics.totalTrades} trades</p>
          {isRealTimeActive && (
            <div className="mt-2 text-xs text-cyan-400 flex items-center">
              <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
              Live updates
            </div>
          )}
        </div>

        {/* Sharpe Ratio */}
        <div 
          key={`sharpe-${animationKey}`}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 transition-all duration-500 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-purple-900 text-purple-300 transition-all duration-300">
              {advancedMetrics.sharpeRatio.toFixed(2)}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">Sharpe Ratio</h3>
          <p className="text-gray-400 text-sm">Risk-adjusted returns</p>
          {isRealTimeActive && (
            <div className="mt-2 text-xs text-cyan-400 flex items-center">
              <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
              Live updates
            </div>
          )}
        </div>

        {/* Max Drawdown */}
        <div 
          key={`drawdown-${animationKey}`}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 transition-all duration-500 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-orange-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-red-900 text-red-300 transition-all duration-300">
              {advancedMetrics.maxDrawdown.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">Max Drawdown</h3>
          <p className="text-gray-400 text-sm">Peak-to-trough decline</p>
          {isRealTimeActive && (
            <div className="mt-2 text-xs text-cyan-400 flex items-center">
              <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
              Live updates
            </div>
          )}
        </div>
      </div>

      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Risk Metrics */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-yellow-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Risk Metrics</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Sortino Ratio</span>
              <span className="text-white font-medium">{advancedMetrics.sortinoRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Calmar Ratio</span>
              <span className="text-white font-medium">{advancedMetrics.calmarRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VaR (95%)</span>
              <span className="text-red-400 font-medium">${advancedMetrics.var95.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">CVaR (95%)</span>
              <span className="text-red-400 font-medium">${advancedMetrics.cvar95.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Activity className="w-6 h-6 text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Performance</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Profit Factor</span>
              <span className="text-white font-medium">{advancedMetrics.profitFactor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Expectancy</span>
              <span className="text-white font-medium">${advancedMetrics.expectancy.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Kelly %</span>
              <span className="text-white font-medium">{(advancedMetrics.kellyPercentage * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volatility</span>
              <span className="text-white font-medium">{advancedMetrics.volatility.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Trade Statistics */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 text-blue-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Trade Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Win</span>
              <span className="text-green-400 font-medium">${advancedMetrics.averageWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Loss</span>
              <span className="text-red-400 font-medium">${advancedMetrics.averageLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Best Trade</span>
              <span className="text-green-400 font-medium">${advancedMetrics.bestTrade.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Worst Trade</span>
              <span className="text-red-400 font-medium">${advancedMetrics.worstTrade.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Performance Visualization</h3>
          <div className="flex items-center space-x-2">
            {[
              { key: 'equity', label: 'Equity Curve', icon: LineChartIcon },
              { key: 'monthly', label: 'Monthly P&L', icon: BarChart3 },
              { key: 'timeOfDay', label: 'Time of Day', icon: Clock },
              { key: 'dayOfWeek', label: 'Day of Week', icon: Calendar },
              { key: 'symbols', label: 'Symbols', icon: PieChart },
              { key: 'distribution', label: 'Distribution', icon: BarChart3 }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedChart(key)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedChart === key
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChart === 'equity' && (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#06B6D4" 
                  fill="url(#equityGradient)"
                  strokeWidth={2}
                />
                <ReferenceLine y={currentAccountData.accountBalance} stroke="#10B981" strokeDasharray="5 5" />
              </AreaChart>
            )}
            
            {selectedChart === 'monthly' && (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="pnl" fill="#06B6D4" />
              </BarChart>
            )}
            
            {selectedChart === 'timeOfDay' && (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="pnl" fill="#8B5CF6" />
              </BarChart>
            )}
            
            {selectedChart === 'dayOfWeek' && (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="pnl" fill="#F59E0B" />
              </BarChart>
            )}
            
            {selectedChart === 'symbols' && (
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({symbol, pnl}) => `${symbol}: $${pnl.toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="pnl"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            )}
            
            {selectedChart === 'distribution' && (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="count" fill="#EF4444" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streaks */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Zap className="w-6 h-6 text-yellow-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Trading Streaks</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Streak</span>
              <span className={`font-medium ${advancedMetrics.currentStreak >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {advancedMetrics.currentStreak >= 0 ? '+' : ''}{advancedMetrics.currentStreak}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Longest Win Streak</span>
              <span className="text-green-400 font-medium">{advancedMetrics.longestWinStreak}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Longest Loss Streak</span>
              <span className="text-red-400 font-medium">{advancedMetrics.longestLossStreak}</span>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Award className="w-6 h-6 text-purple-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Performance Summary</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Recovery Factor</span>
              <span className="text-white font-medium">{advancedMetrics.recoveryFactor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Holding Period</span>
              <span className="text-white font-medium">{advancedMetrics.averageHoldingPeriod.toFixed(1)} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Win/Loss Ratio</span>
              <span className="text-white font-medium">{advancedMetrics.averageWinLossRatio.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Footer */}
      {isRealTimeActive && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Real-time analytics active</span>
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdateTime.toLocaleTimeString()}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Updates every 2 seconds • Data syncs with overview tab
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPerformanceAnalytics;
