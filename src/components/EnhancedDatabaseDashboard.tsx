import React, { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import './EnhancedDatabaseDashboard.css';

interface BotData {
  id: number;
  bot_type: string;
  pair: string;
  timestamp: string;
  price: number;
  signal_type: string;
  signal_strength: number | null;
  is_recommended: boolean;
  volume: number | null;
  high: number | null;
  low: number | null;
  open_price: number | null;
  close_price: number | null;
  timeframe: string;
}

interface BotStatus {
  bot_type: string;
  is_active: boolean;
  last_started: string | null;
  last_stopped: string | null;
}

interface DashboardStats {
  total_signals: number;
  buy_signals: number;
  sell_signals: number;
  recommended_signals: number;
  recent_bot_data: BotData[];
  bot_status: BotStatus[];
}

const EnhancedDatabaseDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mpin, setMpin] = useState('');
  const [showMpinInput, setShowMpinInput] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m');
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'bot-status' | 'raw-data'>('overview');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const DATABASE_MPIN = "231806";

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedPair && selectedTimeframe) {
      fetchChartData();
    }
  }, [selectedPair, selectedTimeframe]);

  const handleMpinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mpin === DATABASE_MPIN) {
      setIsAuthenticated(true);
      setShowMpinInput(false);
      setError('');
    } else {
      setError('Invalid M-PIN. Please try again.');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bot/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError('Failed to fetch dashboard statistics');
        }
      } else {
        setError('Failed to fetch dashboard statistics');
      }
    } catch (err) {
      setError('Error fetching dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bot/ohlc?pair=${selectedPair}&timeframe=${selectedTimeframe}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedData = data.data.map((item: any) => ({
            time: new Date(item.time).getTime() / 1000,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close
          }));
          setChartData(formattedData);
          updateChart(formattedData);
        }
      }
    } catch (err) {
      setError('Error fetching chart data');
    } finally {
      setLoading(false);
    }
  };

  const updateChart = (data: CandlestickData[]) => {
    if (chartContainerRef.current && data.length > 0) {
      if (!chartRef.current) {
        chartRef.current = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 400,
          layout: {
            background: { color: '#1e1e1e' },
            textColor: '#d1d4dc',
          },
          grid: {
            vertLines: { color: '#2B2B43' },
            horzLines: { color: '#2B2B43' },
          },
          crosshair: {
            mode: 1,
          },
          rightPriceScale: {
            borderColor: '#2B2B43',
          },
          timeScale: {
            borderColor: '#2B2B43',
            timeVisible: true,
            secondsVisible: false,
          },
        });

        candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });
      }

      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(data);
      }
    }
  };

  const handleBotToggle = async (botType: string, isActive: boolean) => {
    try {
      const endpoint = isActive ? '/api/bot/stop' : '/api/bot/start';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_type: botType,
          updated_by: 'dashboard_user'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchDashboardStats(); // Refresh stats
        }
      }
    } catch (err) {
      setError('Error updating bot status');
    }
  };

  const getUniquePairs = () => {
    if (!stats?.recent_bot_data) return [];
    const pairs = new Set(stats.recent_bot_data.map(item => item.pair));
    return Array.from(pairs);
  };

  if (showMpinInput) {
    return (
      <div className="database-dashboard">
        <div className="mpin-container">
          <div className="mpin-card">
            <h2>🔐 Database Dashboard Access</h2>
            <p>Enter M-PIN to access the database dashboard</p>
            
            <form onSubmit={handleMpinSubmit} className="mpin-form">
              <div className="input-group">
                <input
                  type="password"
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value)}
                  placeholder="Enter M-PIN"
                  className="mpin-input"
                  maxLength={6}
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button type="submit" className="mpin-submit-btn">
                Access Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="database-dashboard">
      <div className="dashboard-header">
        <h1>📊 Database Dashboard</h1>
        <div className="auth-status">
          <span className="authenticated-badge">🔒 Authenticated</span>
          <button 
            onClick={() => {
              setIsAuthenticated(false);
              setShowMpinInput(true);
              setMpin('');
            }}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </button>
        <button
          className={`tab-btn ${activeTab === 'bot-status' ? 'active' : ''}`}
          onClick={() => setActiveTab('bot-status')}
        >
          Bot Status
        </button>
        <button
          className={`tab-btn ${activeTab === 'raw-data' ? 'active' : ''}`}
          onClick={() => setActiveTab('raw-data')}
        >
          Raw Data
        </button>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{stats?.total_signals || 0}</div>
                <div className="stat-label">Total Signals</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-value">{stats?.buy_signals || 0}</div>
                <div className="stat-label">Buy Signals</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📉</div>
                <div className="stat-value">{stats?.sell_signals || 0}</div>
                <div className="stat-label">Sell Signals</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{stats?.recommended_signals || 0}</div>
                <div className="stat-label">Recommended</div>
              </div>
            </div>

            <div className="data-sections">
              <div className="section-card">
                <h3>Recent Bot Data</h3>
                <div className="recent-data">
                  {stats?.recent_bot_data?.map((item, index) => (
                    <div key={index} className="data-item">
                      <span className="data-pair">{item.pair}</span>
                      <span className="data-price">${item.price.toFixed(5)}</span>
                      <span className={`data-signal ${item.signal_type}`}>
                        {item.signal_type}
                      </span>
                      <span className="data-time">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-card">
                <h3>Bot Status</h3>
                <div className="bot-status-list">
                  {stats?.bot_status?.map((bot, index) => (
                    <div key={index} className="bot-status-item">
                      <span className="bot-type">{bot.bot_type}</span>
                      <span className={`status-badge ${bot.is_active ? 'active' : 'inactive'}`}>
                        {bot.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleBotToggle(bot.bot_type, bot.is_active)}
                        className={`toggle-btn ${bot.is_active ? 'stop' : 'start'}`}
                      >
                        {bot.is_active ? 'Stop' : 'Start'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="charts-tab">
            <div className="chart-controls">
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="pair-select"
              >
                <option value="">Select Trading Pair</option>
                {getUniquePairs().map(pair => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
              
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="timeframe-select"
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
              </select>
            </div>
            
            {selectedPair && (
              <div className="chart-container">
                <div ref={chartContainerRef} className="chart"></div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bot-status' && (
          <div className="bot-status-tab">
            <h3>Bot Management</h3>
            <div className="bot-controls">
              {stats?.bot_status?.map((bot, index) => (
                <div key={index} className="bot-control-card">
                  <div className="bot-info">
                    <h4>{bot.bot_type.toUpperCase()} Bot</h4>
                    <p>Status: <span className={`status ${bot.is_active ? 'active' : 'inactive'}`}>
                      {bot.is_active ? '🟢 Running' : '🔴 Stopped'}
                    </span></p>
                    {bot.last_started && (
                      <p>Last Started: {new Date(bot.last_started).toLocaleString()}</p>
                    )}
                    {bot.last_stopped && (
                      <p>Last Stopped: {new Date(bot.last_stopped).toLocaleString()}</p>
                    )}
                  </div>
                  
                  <div className="bot-actions">
                    <button
                      onClick={() => handleBotToggle(bot.bot_type, bot.is_active)}
                      className={`action-btn ${bot.is_active ? 'stop' : 'start'}`}
                    >
                      {bot.is_active ? '🛑 Stop Bot' : '▶️ Start Bot'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'raw-data' && (
          <div className="raw-data-tab">
            <h3>Raw Bot Data</h3>
            <div className="data-filters">
              <select className="filter-select">
                <option value="">All Bot Types</option>
                <option value="crypto">Crypto</option>
                <option value="forex">Forex</option>
              </select>
              
              <select className="filter-select">
                <option value="">All Pairs</option>
                {getUniquePairs().map(pair => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
            </div>
            
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Bot Type</th>
                    <th>Pair</th>
                    <th>Price</th>
                    <th>Signal</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recent_bot_data?.map((item, index) => (
                    <tr key={index}>
                      <td>{new Date(item.timestamp).toLocaleString()}</td>
                      <td>{item.bot_type}</td>
                      <td>{item.pair}</td>
                      <td>${item.price.toFixed(5)}</td>
                      <td className={`signal-${item.signal_type}`}>{item.signal_type}</td>
                      <td>{item.volume?.toFixed(2) || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDatabaseDashboard;
