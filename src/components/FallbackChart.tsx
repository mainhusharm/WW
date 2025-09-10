import React from 'react';

interface FallbackChartProps {
  symbol?: string;
  height?: string;
}

const FallbackChart: React.FC<FallbackChartProps> = ({ 
  symbol = 'BTC/USD', 
  height = '400px' 
}) => {
  return (
    <div 
      className="flex items-center justify-center bg-gray-900 rounded-lg border border-gray-700"
      style={{ height }}
    >
      <div className="text-center text-gray-400 p-8">
        <div className="text-4xl mb-4">📈</div>
        <div className="text-lg font-semibold mb-2">Chart Loading</div>
        <div className="text-sm mb-4">TradingView chart is being initialized...</div>
        <div className="text-xs text-gray-500">
          Symbol: {symbol}
        </div>
        <div className="mt-4">
          <div className="animate-pulse bg-gray-700 h-2 rounded mb-2"></div>
          <div className="animate-pulse bg-gray-700 h-2 rounded mb-2"></div>
          <div className="animate-pulse bg-gray-700 h-2 rounded mb-2"></div>
          <div className="animate-pulse bg-gray-700 h-2 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
};

export default FallbackChart;
