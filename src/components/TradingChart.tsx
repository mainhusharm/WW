// TradingViewWidget.jsx
import React, { useEffect, useRef, memo, useState } from 'react';
import FallbackChart from './FallbackChart';

let isScriptAppended = false;

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isScriptAppended || !container.current) return;

    const loadTradingViewScript = () => {
      try {
        // Check if TradingView is already available
        if (window.TradingView) {
          initializeWidget();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.onload = () => {
          console.log('TradingView script loaded successfully');
          initializeWidget();
        };
        script.onerror = (error) => {
          console.error('Failed to load TradingView script:', error);
          setHasError(true);
          setIsLoading(false);
        };
        
        script.innerHTML = JSON.stringify({
          "allow_symbol_change": true,
          "calendar": false,
          "details": false,
          "hide_side_toolbar": true,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "hide_volume": false,
          "hotlist": false,
          "interval": "D",
          "locale": "en",
          "save_image": true,
          "style": "1",
          "symbol": "BINANCE:BTCUSDT",
          "theme": "dark",
          "timezone": "Etc/UTC",
          "backgroundColor": "rgba(17, 24, 39, 1)",
          "gridColor": "rgba(255, 255, 255, 0.06)",
          "watchlist": [],
          "withdateranges": false,
          "compareSymbols": [],
          "studies": [],
          "autosize": true
        });
        
        if (container.current) {
          container.current.appendChild(script);
          isScriptAppended = true;
        }
      } catch (error) {
        console.error('Error loading TradingView widget:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    const initializeWidget = () => {
      try {
        setIsLoading(false);
        setHasError(false);
      } catch (error) {
        console.error('Error initializing TradingView widget:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(loadTradingViewScript, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (hasError) {
    return <FallbackChart symbol="BTC/USD" height="100%" />;
  }

  if (isLoading) {
    return <FallbackChart symbol="BTC/USD" height="100%" />;
  }

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
      <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span className="blue-text">Track all markets on TradingView</span></a></div>
    </div>
  );
}

export default memo(TradingViewWidget);
