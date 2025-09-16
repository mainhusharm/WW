// Production API Client
// Handles API requests for production environment with proper CORS handling

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

class ProductionApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Use direct API calls in production instead of CORS proxies
    this.baseUrl = 'http://localhost:3001';
    this.timeout = 10000; // 10 seconds
  }

  // Check if we're in production environment
  private isProduction(): boolean {
    return window.location.hostname.includes('onrender.com') || 
           window.location.hostname.includes('traderedgepro.com') ||
           !window.location.hostname.includes('localhost');
  }

  // Make API request with proper error handling
  async request<T = any>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const requestOptions: RequestInit = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        mode: 'cors',
        credentials: 'omit' // Don't send cookies to avoid CORS issues
      };

      // Remove authorization header if using CORS proxy
      if (this.isProduction() && options.headers?.Authorization) {
        // In production, we'll handle auth differently
        delete requestOptions.headers?.Authorization;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        status: response.status
      };

    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 0
      };
    }
  }

  // Get user profile (with fallback to localStorage)
  async getUserProfile(): Promise<ApiResponse> {
    // First try API
    const apiResult = await this.request('/api/user/profile');
    
    if (apiResult.success) {
      return apiResult;
    }

    // Fallback to localStorage
    const localUser = localStorage.getItem('user');
    if (localUser) {
      try {
        const userData = JSON.parse(localUser);
        return {
          success: true,
          data: userData
        };
      } catch (e) {
        console.warn('Failed to parse user data from localStorage');
      }
    }

    return {
      success: false,
      error: 'No user data available'
    };
  }

  // Get user progress (with fallback to localStorage)
  async getUserProgress(): Promise<ApiResponse> {
    // First try API
    const apiResult = await this.request('/api/user/progress');
    
    if (apiResult.success) {
      return apiResult;
    }

    // Fallback to localStorage
    const localProgress = localStorage.getItem('user_progress');
    if (localProgress) {
      try {
        const progressData = JSON.parse(localProgress);
        return {
          success: true,
          data: progressData
        };
      } catch (e) {
        console.warn('Failed to parse progress data from localStorage');
      }
    }

    return {
      success: false,
      error: 'No progress data available'
    };
  }

  // Get bulk data (with fallback to localStorage)
  async getBulkData(symbols: string[]): Promise<ApiResponse> {
    // First try API
    const apiResult = await this.request('/api/bulk', {
      method: 'POST',
      body: { symbols }
    });
    
    if (apiResult.success) {
      return apiResult;
    }

    // Fallback to localStorage
    const localData = localStorage.getItem('bulk_data');
    if (localData) {
      try {
        const bulkData = JSON.parse(localData);
        return {
          success: true,
          data: bulkData
        };
      } catch (e) {
        console.warn('Failed to parse bulk data from localStorage');
      }
    }

    return {
      success: false,
      error: 'No bulk data available'
    };
  }

  // Get forex data (with fallback to localStorage)
  async getForexData(symbols: string[]): Promise<ApiResponse> {
    // First try API
    const apiResult = await this.request('/api/forex/bulk', {
      method: 'POST',
      body: { symbols }
    });
    
    if (apiResult.success) {
      return apiResult;
    }

    // Fallback to localStorage
    const localData = localStorage.getItem('forex_data');
    if (localData) {
      try {
        const forexData = JSON.parse(localData);
        return {
          success: true,
          data: forexData
        };
      } catch (e) {
        console.warn('Failed to parse forex data from localStorage');
      }
    }

    return {
      success: false,
      error: 'No forex data available'
    };
  }
}

// Export singleton instance
export default new ProductionApiClient();
