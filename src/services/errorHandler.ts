// Error Handler Service - Centralized error handling and API management
// Handles different types of API calls with proper error handling and fallbacks

interface ServiceStatus {
  mainApi: boolean;
  customerService: boolean;
  telegramService: boolean;
  yfinanceService: boolean;
  binanceService: boolean;
  forexDataService: boolean;
}

interface PriceData {
  price: number;
  symbol: string;
  cached?: boolean;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  status: string;
}

class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private serviceStatus: ServiceStatus = {
    mainApi: false,
    customerService: false,
    telegramService: false,
    yfinanceService: false,
    binanceService: false,
    forexDataService: false
  };

  private constructor() {
    this.checkAllServices();
  }

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  private async checkAllServices() {
    // Check main API only - this is the only health check needed on every page
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      this.serviceStatus.mainApi = response.ok;
    } catch {
      this.serviceStatus.mainApi = false;
    }

    // Check customer service (only in development)
    if (process.env.NODE_ENV === 'development') {
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
        this.serviceStatus.customerService = response.ok;
      } catch {
        this.serviceStatus.customerService = false;
      }
    }

    // REMOVED: Unnecessary health checks to external services that cause CORS errors
    // These should only be checked when specifically needed (e.g., forex data tab)
    // NOT on every page load
    
    console.log('Service Status:', this.serviceStatus);
  }

  // Method to check specific services when needed (e.g., forex data tab)
  async checkSpecificService(serviceName: string): Promise<boolean> {
    try {
      let healthUrl = '';
      
      switch (serviceName) {
        case 'yfinance':
          healthUrl = 'https://yfinance-service-kyce.onrender.com/health';
          break;
        case 'binance':
          healthUrl = 'https://binance-service.onrender.com/health';
          break;
        case 'telegram':
          healthUrl = 'https://yfinance-service-kyce.onrender.com/api/telegram/health';
          break;
        default:
          return false;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      
      // Update service status
      if (serviceName === 'yfinance') {
        this.serviceStatus.yfinanceService = isHealthy;
      } else if (serviceName === 'binance') {
        this.serviceStatus.binanceService = isHealthy;
      } else if (serviceName === 'telegram') {
        this.serviceStatus.telegramService = isHealthy;
      }
      
      return isHealthy;
    } catch (error) {
      console.warn(`Health check failed for ${serviceName}:`, error);
      
      // Update service status to false
      if (serviceName === 'yfinance') {
        this.serviceStatus.yfinanceService = false;
      } else if (serviceName === 'binance') {
        this.serviceStatus.binanceService = false;
      } else if (serviceName === 'telegram') {
        this.serviceStatus.telegramService = false;
      }
      
      return false;
    }
  }

  async handlePriceApi<T>(apiCall: () => Promise<T>, symbol: string): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`Price API error for ${symbol}:`, error);
      
      // Return cached data if available
      const cachedData = this.getCachedPriceData(symbol);
      if (cachedData) {
        return cachedData as T;
      }
      
      throw error;
    }
  }

  async handleCustomersApi<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      console.error('Customer API error:', error);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return this.getMockCustomerData() as T;
      }
      
      throw error;
    }
  }

  async handleTelegramApi<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      console.error('Telegram API error:', error);
      
      // Return cached messages if available
      const cachedMessages = this.getCachedTelegramMessages();
      if (cachedMessages) {
        return cachedMessages as T;
      }
      
      throw error;
    }
  }

  private getCachedPriceData(symbol: string): PriceData | null {
    try {
      const cached = localStorage.getItem(`price_cache_${symbol}`);
      if (cached) {
        const data = JSON.parse(cached);
        const cacheAge = Date.now() - data.timestamp;
        
        // Cache valid for 5 minutes
        if (cacheAge < 5 * 60 * 1000) {
          return { ...data.data, cached: true };
        }
      }
    } catch (error) {
      console.warn('Error reading cached price data:', error);
    }
    return null;
  }

  private getCachedTelegramMessages(): any[] | null {
    try {
      const cached = localStorage.getItem('telegram_messages');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Error reading cached telegram messages:', error);
    }
    return null;
  }

  private getMockCustomerData(): CustomerData[] {
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'active'
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        status: 'inactive'
      }
    ];
  }

  getServiceStatus(): ServiceStatus {
    return { ...this.serviceStatus };
  }

  async refreshServiceStatus(): Promise<void> {
    await this.checkAllServices();
  }
}

export const errorHandler = ErrorHandlerService.getInstance();
