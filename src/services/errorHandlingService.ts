import { ENV_CONFIG } from '../api/config';

interface FallbackData {
  [key: string]: any;
}

interface ErrorConfig {
  showUserMessage?: boolean;
  logToConsole?: boolean;
  retryCount?: number;
  fallbackData?: any;
}

class ErrorHandlingService {
  private fallbackData: FallbackData = {
    customers: [],
    notifications: [],
    tickets: [],
    stats: {
      totalCustomers: 0,
      activeChats: 0,
      openTickets: 0,
      avgResponseTime: 'N/A',
      satisfactionScore: 0,
      newCustomersToday: 0,
      resolvedTicketsToday: 0
    },
    dashboard: {
      account_balance: 100000,
      total_pnl: 0,
      win_rate: 0,
      recent_trades: []
    }
  };

  private retryConfigs: { [endpoint: string]: number } = {};

  constructor() {
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling() {
    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason, {
        showUserMessage: true,
        logToConsole: true
      });
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleError(event.error, {
        showUserMessage: true,
        logToConsole: true
      });
    });
  }

  public async fetchWithFallback<T>(
    url: string,
    options: RequestInit = {},
    fallbackKey?: string,
    config: ErrorConfig = {}
  ): Promise<T> {
    const {
      showUserMessage = true,
      logToConsole = true,
      retryCount = 3,
      fallbackData = null
    } = config;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;

      } catch (error) {
        lastError = error as Error;
        
        if (logToConsole) {
          console.warn(`API call failed (attempt ${attempt}/${retryCount}) for ${url}:`, error);
        }

        // If this is the last attempt, use fallback data
        if (attempt === retryCount) {
          const fallback = fallbackData || this.getFallbackData(url, fallbackKey);
          
          if (fallback) {
            if (logToConsole) {
              console.log(`Using fallback data for ${url}`);
            }
            
            if (showUserMessage) {
              this.showUserMessage('warning', 'Using offline data - some features may be limited');
            }
            
            return fallback as T;
          }
          
          // No fallback available, throw the error
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private getFallbackData(url: string, fallbackKey?: string): any {
    if (fallbackKey) {
      return this.fallbackData[fallbackKey];
    }

    // Auto-detect fallback key from URL
    if (url.includes('/customers')) {
      return this.fallbackData.customers;
    } else if (url.includes('/notifications')) {
      return this.fallbackData.notifications;
    } else if (url.includes('/tickets')) {
      return this.fallbackData.tickets;
    } else if (url.includes('/stats')) {
      return this.fallbackData.stats;
    } else if (url.includes('/dashboard')) {
      return this.fallbackData.dashboard;
    }

    return null;
  }

  public handleError(error: Error | string, config: ErrorConfig = {}): void {
    const {
      showUserMessage = true,
      logToConsole = true
    } = config;

    const errorMessage = typeof error === 'string' ? error : error.message;

    if (logToConsole) {
      console.error('Error handled:', errorMessage);
    }

    if (showUserMessage) {
      this.showUserMessage('error', this.getUserFriendlyMessage(errorMessage));
    }
  }

  private getUserFriendlyMessage(errorMessage: string): string {
    // Map technical errors to user-friendly messages
    const errorMap: { [key: string]: string } = {
      'Failed to fetch': 'Network connection issue. Please check your internet connection.',
      'NetworkError': 'Network connection issue. Please check your internet connection.',
      'timeout': 'Request timed out. Please try again.',
      '401': 'Authentication required. Please log in again.',
      '403': 'Access denied. You don\'t have permission for this action.',
      '404': 'Resource not found. Please check the URL and try again.',
      '500': 'Server error. Please try again later.',
      '502': 'Service temporarily unavailable. Please try again later.',
      '503': 'Service temporarily unavailable. Please try again later.',
      '504': 'Request timed out. Please try again later.'
    };

    for (const [key, message] of Object.entries(errorMap)) {
      if (errorMessage.includes(key)) {
        return message;
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }

  private showUserMessage(type: 'error' | 'warning' | 'info', message: string): void {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-black' :
      'bg-blue-500 text-white'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="font-medium">${type.toUpperCase()}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-sm opacity-75 hover:opacity-100">
          ×
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  public setFallbackData(key: string, data: any): void {
    this.fallbackData[key] = data;
  }

  public getFallbackData(key: string): any {
    return this.fallbackData[key];
  }

  public isOffline(): boolean {
    return !navigator.onLine;
  }

  public async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  public getRetryCount(endpoint: string): number {
    return this.retryConfigs[endpoint] || 0;
  }

  public setRetryCount(endpoint: string, count: number): void {
    this.retryConfigs[endpoint] = count;
  }
}

// Create singleton instance
const errorHandlingService = new ErrorHandlingService();

export default errorHandlingService;
