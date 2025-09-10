import React, { useRef, useEffect, memo, useState } from 'react';
import FallbackChart from './FallbackChart';

let isScriptAppended = false;

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!container.current) return;

    const loadTradingViewScript = () => {
      try {
        // Check if TradingView is already available
        if (window.TradingView) {
          initializeWidget();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
        script.type = "text/javascript";
        script.async = true;
        script.onload = () => {
          console.log('TradingView mini chart script loaded successfully');
          initializeWidget();
        };
        script.onerror = (error) => {
          console.error('Failed to load TradingView mini chart script:', error);
          setHasError(true);
          setIsLoading(false);
        };
        script.innerHTML = JSON.stringify({
          "symbol": "OANDA:XAUUSD",
          "chartOnly": false,
          "dateRange": "ALL",
          "noTimeScale": false,
          "colorTheme": "light",
          "isTransparent": false,
          "locale": "en",
          "width": "100%",
          "autosize": true,
          "height": "100%"
        });
        
        if (container.current) {
          container.current.appendChild(script);
          isScriptAppended = true;
        }
      } catch (error) {
        console.error('Error loading TradingView mini chart:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    const initializeWidget = () => {
      try {
        setIsLoading(false);
        setHasError(false);
      } catch (error) {
        console.error('Error initializing TradingView mini chart:', error);
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
    return <FallbackChart symbol="XAU/USD" height="100%" />;
  }

  if (isLoading) {
    return <FallbackChart symbol="XAU/USD" height="100%" />;
  }

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);