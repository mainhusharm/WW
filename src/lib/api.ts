// API utility for handling backend requests in development and production
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getFullUrl(endpoint: string): string {
    // If endpoint starts with /api, use it as relative (for proxy in dev)
    if (endpoint.startsWith('/api')) {
      // In development, use relative URLs for proxy
      // In production, construct full URL
      if (import.meta.env.DEV) {
        return endpoint;
      } else {
        // Remove leading slash from endpoint if present
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${this.baseUrl}/${cleanEndpoint}`;
      }
    }

    // For full URLs, use as-is
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    // For other endpoints, construct full URL
    return `${this.baseUrl}/${endpoint}`;
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = this.getFullUrl(endpoint);

    console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async get(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await this.request(endpoint, { ...options, method: 'GET' });
    return response.json();
  }

  async post(endpoint: string, data?: any, options: RequestInit = {}): Promise<any> {
    const response = await this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async put(endpoint: string, data?: any, options: RequestInit = {}): Promise<any> {
    const response = await this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async delete(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
    return response.json();
  }
}

// Create API client instance
export const apiClient = new ApiClient();

// Convenience functions for common endpoints
export const api = {
  // Authentication
  auth: {
    sendOtp: (email: string) => apiClient.post('/api/auth/send-otp', { email }),
    resendOtp: (email: string) => apiClient.post('/api/auth/send-otp', { email }),
    verifyOtp: (data: { email: string; otpCode: string }) =>
      apiClient.post('/api/auth/verify-otp', data),
    loginWithPassword: (data: { email: string; password: string }) =>
      apiClient.post('/api/auth/login', data),
    register: (userData: any) => apiClient.post('/api/auth/register', userData),
  },

  // Email
  email: {
    sendWelcome: (data: { email: string; userName: string }) =>
      apiClient.post('/api/email/welcome', data),
    sendAuth: (data: { email: string; ipAddress?: string; location?: string }) =>
      apiClient.post('/api/email/auth', data),
  },

  // Payment
  payment: {
    complete: (data: { email: string; paymentId: string; planData: any }) =>
      apiClient.post('/api/payment/complete', data),
  },

  // Users
  users: {
    getById: (id: string) => apiClient.get(`/api/users/${id}`),
    update: (id: string, data: any) => apiClient.put(`/api/users/${id}`, data),
  },

  // Health check
  health: () => apiClient.get('/health'),
};

// Export for backward compatibility
export default api;
