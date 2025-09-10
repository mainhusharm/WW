// Global TradingView loader service to prevent conflicts and dce.getInstance errors

class TradingViewLoader {
  private static instance: TradingViewLoader;
  private isLoaded = false;
  private isLoading = false;
  private loadPromises: Promise<void>[] = [];

  private constructor() {}

  public static getInstance(): TradingViewLoader {
    if (!TradingViewLoader.instance) {
      TradingViewLoader.instance = new TradingViewLoader();
    }
    return TradingViewLoader.instance;
  }

  public async loadTradingViewScript(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded || window.TradingView) {
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.isLoading) {
      return new Promise((resolve) => {
        this.loadPromises.push(new Promise((innerResolve) => {
          const checkLoaded = () => {
            if (this.isLoaded || window.TradingView) {
              innerResolve();
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        }));
      });
    }

    this.isLoading = true;

    return new Promise((resolve, reject) => {
      try {
        // Check if script already exists
        const existingScript = document.querySelector('script[src*="tradingview.com"]');
        if (existingScript) {
          this.isLoaded = true;
          this.isLoading = false;
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.async = true;
        
        script.onload = () => {
          console.log('TradingView core library loaded successfully');
          this.isLoaded = true;
          this.isLoading = false;
          
          // Resolve all pending promises
          this.loadPromises.forEach(promise => {
            if (typeof promise === 'function') {
              (promise as any)();
            }
          });
          this.loadPromises = [];
          
          resolve();
        };

        script.onerror = (error) => {
          console.error('Failed to load TradingView core library:', error);
          this.isLoading = false;
          reject(error);
        };

        // Add to head to ensure it loads before any widget scripts
        document.head.appendChild(script);

        // Add global error handler for TradingView
        window.addEventListener('error', (e) => {
          if (e.error && e.error.message && e.error.message.includes('dce.getInstance')) {
            console.warn('TradingView dce.getInstance error caught and handled globally');
            e.preventDefault();
            return false;
          }
        });

      } catch (error) {
        console.error('Error setting up TradingView loader:', error);
        this.isLoading = false;
        reject(error);
      }
    });
  }

  public async loadWidgetScript(widgetType: 'advanced-chart' | 'mini-symbol-overview'): Promise<void> {
    // First ensure core library is loaded
    await this.loadTradingViewScript();

    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-${widgetType}.js`;
    
    // Check if this specific widget script is already loaded
    const existingScript = document.querySelector(`script[src*="${widgetType}"]`);
    if (existingScript) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.type = 'text/javascript';
        script.async = true;
        
        script.onload = () => {
          console.log(`TradingView ${widgetType} widget script loaded successfully`);
          resolve();
        };

        script.onerror = (error) => {
          console.error(`Failed to load TradingView ${widgetType} widget script:`, error);
          reject(error);
        };

        document.head.appendChild(script);

      } catch (error) {
        console.error(`Error loading TradingView ${widgetType} widget:`, error);
        reject(error);
      }
    });
  }

  public isTradingViewLoaded(): boolean {
    return this.isLoaded || !!window.TradingView;
  }
}

export default TradingViewLoader.getInstance();
