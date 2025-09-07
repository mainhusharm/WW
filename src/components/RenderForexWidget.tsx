import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  RefreshIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import useRenderForex from '../hooks/useRenderForex';

interface RenderForexWidgetProps {
  symbols?: string[];
  compact?: boolean;
  showVolume?: boolean;
  showChange?: boolean;
  refreshInterval?: number;
  className?: string;
}

const RenderForexWidget: React.FC<RenderForexWidgetProps> = ({
  symbols = ['EUR/USD', 'GBP/USD'],
  compact = false,
  showVolume = true,
  showChange = true,
  refreshInterval = 10000,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, loading, error, refresh } = useRenderForex({
    symbols,
    autoRefresh,
    refreshInterval
  });

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUpIcon className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDownIcon className="h-4 w-4 text-red-600" />
    );
  };

  const formatPrice = (price: number) => {
    return price.toFixed(5);
  };

  const formatChange = (change: number) => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(5)}`;
  };

  const formatChangePercent = (changePercent: number) => {
    return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 text-sm mb-2">⚠️ Error loading data</div>
          <button
            onClick={refresh}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Forex Rates</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-1 rounded ${
                autoRefresh ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-gray-100'
              }`}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              <RefreshIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {compact ? (
          // Compact view
          <div className="space-y-3">
            {data.slice(0, 3).map((forexData) => (
              <div key={forexData.symbol} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{forexData.symbol}</div>
                  {showChange && (
                    <div className="text-xs text-gray-500">
                      {getChangeIcon(forexData.change)}
                      <span className={`ml-1 ${getChangeColor(forexData.change)}`}>
                        {formatChangePercent(forexData.changePercent)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatPrice(forexData.bid)}
                  </div>
                  {showVolume && (
                    <div className="text-xs text-gray-500">
                      Vol: {forexData.volume.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Expanded view
          <div className="space-y-4">
            {data.map((forexData) => (
              <div key={forexData.symbol} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{forexData.symbol}</h4>
                  <div className="text-sm text-gray-500">
                    {new Date(forexData.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Bid</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPrice(forexData.bid)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Ask</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPrice(forexData.ask)}
                    </div>
                  </div>
                </div>

                {showChange && (
                  <div className="bg-gray-50 rounded p-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Change</span>
                      <div className="flex items-center">
                        {getChangeIcon(forexData.change)}
                        <span className={`ml-1 text-sm font-medium ${getChangeColor(forexData.change)}`}>
                          {formatChange(forexData.change)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Change %</span>
                      <span className={`text-sm font-medium ${getChangeColor(forexData.changePercent)}`}>
                        {formatChangePercent(forexData.changePercent)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-gray-500">Spread</div>
                    <div className="font-medium text-red-600">
                      {formatPrice(forexData.spread)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">High</div>
                    <div className="font-medium text-green-600">
                      {formatPrice(forexData.high)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Low</div>
                    <div className="font-medium text-red-600">
                      {formatPrice(forexData.low)}
                    </div>
                  </div>
                </div>

                {showVolume && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Volume</span>
                      <span className="font-medium text-gray-900">
                        {forexData.volume.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{data.length} pairs</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderForexWidget;
