import React, { useState, useEffect } from 'react';
import { Globe, Clock, TrendingUp, AlertTriangle, RefreshCw, Filter } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  impact: 'low' | 'medium' | 'high';
  currency: string;
  time: string;
  date: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  description?: string;
}

const NewForexNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching forex news from backend...');
      const response = await fetch(`https://backend-bkt7.onrender.com/api/news/forex-factory?currency=${selectedCurrency}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Forex news endpoint not found, using mock data');
          setNews(getMockNewsData());
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('News response:', data);
      
      if (data.success && Array.isArray(data.news)) {
        setNews(data.news);
        console.log('News loaded successfully:', data.news.length);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedCurrency]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <TrendingUp className="w-4 h-4" />;
      case 'low': return <Globe className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading forex news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Globe className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Error loading news: {error}</p>
          <button 
            onClick={fetchNews}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Forex Factory News</h1>
          <p className="text-gray-400">Real-time economic calendar and news events</p>
        </div>
        <button 
          onClick={fetchNews}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Currencies</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
              <option value="NZD">NZD</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{news.length}</div>
            <div className="text-sm text-gray-400">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">
              {news.filter(n => n.impact === 'high').length}
            </div>
            <div className="text-sm text-gray-400">High Impact</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {news.filter(n => n.impact === 'medium').length}
            </div>
            <div className="text-sm text-gray-400">Medium Impact</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {news.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No news events found</p>
            <p className="text-gray-500 text-sm">Try selecting a different currency or date</p>
          </div>
        ) : (
          news.map((item) => (
            <div key={item.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-gray-300 mb-3">{item.description}</p>
                  )}
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getImpactColor(item.impact)}`}>
                  {getImpactIcon(item.impact)}
                  <span className="text-sm font-medium capitalize">{item.impact} Impact</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Currency</p>
                  <p className="text-lg font-semibold text-white">{item.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Time</p>
                  <p className="text-lg font-semibold text-white">{item.time}</p>
                </div>
                {item.forecast && (
                  <div>
                    <p className="text-sm text-gray-400">Forecast</p>
                    <p className="text-lg font-semibold text-blue-400">{item.forecast}</p>
                  </div>
                )}
                {item.actual && (
                  <div>
                    <p className="text-sm text-gray-400">Actual</p>
                    <p className="text-lg font-semibold text-green-400">{item.actual}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{item.date}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                    View Details
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                    Add Alert
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Mock news data fallback function
const getMockNewsData = () => [
  {
    id: '1',
    title: 'USD Non-Farm Payrolls',
    currency: 'USD',
    impact: 'High',
    time: '13:30',
    date: '2024-01-05',
    forecast: '200K',
    actual: '216K',
    previous: '173K'
  },
  {
    id: '2',
    title: 'EUR Interest Rate Decision',
    currency: 'EUR',
    impact: 'High',
    time: '14:45',
    date: '2024-01-05',
    forecast: '4.25%',
    actual: '4.25%',
    previous: '4.25%'
  },
  {
    id: '3',
    title: 'GBP CPI Data',
    currency: 'GBP',
    impact: 'Medium',
    time: '09:30',
    date: '2024-01-05',
    forecast: '3.8%',
    actual: '3.9%',
    previous: '3.9%'
  }
];

export default NewForexNews;
