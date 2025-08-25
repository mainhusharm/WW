// Error handling service for API failures and fallbacks
export interface ErrorHandlerConfig {
  enableFallbacks: boolean;
  logErrors: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface FallbackData {
  signals: any[];
  customers: any[];
  forexData: any[];
  prices: Record<string, number>;
}

class ErrorHandlerService {
  private config: ErrorHandlerConfig;
  private fallbackData: FallbackData;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableFallbacks: true,
      logErrors: import.meta.env.DEV,
      retryAttempts: 2,
      retryDelay: 1000,
      ...config
    };

    this.fallbackData = {
      signals: [],
      customers: [],
      forexData: [],
      prices: {}
    };

    this.initializeFallbackData();
  }

  private initializeFallbackData() {
    // Load any cached data from localStorage
    try {
      const cachedSignals = localStorage.getItem('cached_signals');
      if (cachedSignals) {
        this.fallbackData.signals = JSON.parse(cachedSignals);
      }

      const cachedCustomers = localStorage.getItem('cached_customers');
      if (cachedCustomers) {
        this.fallbackData.customers = JSON.parse(cachedCustomers);
      }

      const cachedPrices = localStorage.getItem('cached_prices');
      if (cachedPrices) {
        this.fallbackData.prices = JSON.parse(cachedPrices);
      }
    } catch (error) {
      if (this.config.logErrors) {
        console.warn('Failed to load cached fallback data:', error);
      }
    }
  }

  async handleApiCall<T>(
    apiCall: () => Promise<T>,
    fallbackData: T,
    cacheKey?: string
  ): Promise<T> {
    let lastError: Error | null = null;

    // Try the API call with retries
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await apiCall();
        
        // Cache successful results
        if (cacheKey && result) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (cacheError) {
            if (this.config.logErrors) {
              console.warn('Failed to cache result:', cacheError);
            }
          }
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (this.config.logErrors && attempt === 0) {
          console.warn(`API call failed (attempt ${attempt + 1}):`, error);
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    // All attempts failed, use fallback
    if (this.config.enableFallbacks) {
      if (this.config.logErrors) {
        console.warn('All API attempts failed, using fallback data:', lastError);
      }
      return fallbackData;
    }

    // No fallback enabled, throw the error
    throw lastError;
  }

  // Specific handlers for different API endpoints
  async handleSignalsApi(apiCall: () => Promise<any[]>): Promise<any[]> {
    return this.handleApiCall(
      apiCall,
      this.fallbackData.signals,
      'cached_signals'
    );
  }

  async handleCustomersApi(apiCall: () => Promise<any[]>): Promise<any[]> {
    return this.handleApiCall(
      apiCall,
      this.fallbackData.customers,
      'cached_customers'
    );
  }

  async handleForexDataApi(apiCall: () => Promise<any>): Promise<any> {
    return this.handleApiCall(
      apiCall,
      { data: [], message: 'Using cached data due to API unavailability' },
      'cached_forex_data'
    );
  }

  async handlePriceApi(apiCall: () => Promise<any>, symbol: string): Promise<any> {
    const fallbackPrice = this.fallbackData.prices[symbol] || 0;
    return this.handleApiCall(
      apiCall,
      { price: fallbackPrice, symbol, cached: true },
      `cached_price_${symbol}`
    );
  }

  // Method to update fallback data
  updateFallbackData(type: keyof FallbackData, data: any) {
    this.fallbackData[type] = data;
    try {
      localStorage.setItem(`cached_${type}`, JSON.stringify(data));
    } catch (error) {
      if (this.config.logErrors) {
        console.warn('Failed to update fallback data:', error);
      }
    }
  }

  // Method to check if services are available
  async checkServiceHealth(): Promise<Record<string, boolean>> {
    const services = {
      mainApi: false,
      forexService: false,
      customerService: false
    };

    // Check main API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      services.mainApi = response.ok;
    } catch {
      services.mainApi = false;
    }

    // Check forex service
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const forexUrl = 'https://forex-data-service.onrender.com';
      const response = await fetch(`${forexUrl}/health`, { 
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      services.forexService = response.ok;
    } catch {
      services.forexService = false;
    }

    // Check customer service (only in development)
    if (import.meta.env.DEV) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('http://localhost:5001/health', { 
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        services.customerService = response.ok;
      } catch {
        services.customerService = false;
      }
    }

    return services;
  }

  // Method to get service status message
  getServiceStatusMessage(services: Record<string, boolean>): string {
    const availableServices = Object.entries(services)
      .filter(([_, available]) => available)
      .map(([service, _]) => service);

    if (availableServices.length === 0) {
      return 'All services are currently offline. Using cached data.';
    } else if (availableServices.length === Object.keys(services).length) {
      return 'All services are operational.';
    } else {
      return `Some services are offline. Available: ${availableServices.join(', ')}`;
    }
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandlerService();

// Export utility functions
export const withErrorHandling = <T>(
  apiCall: () => Promise<T>,
  fallbackData: T,
  cacheKey?: string
): Promise<T> => {
  return errorHandler.handleApiCall(apiCall, fallbackData, cacheKey);
};

export const checkApiHealth = () => errorHandler.checkServiceHealth();

export default ErrorHandlerService;
