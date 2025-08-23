import axios from 'axios';
import { API_BASE_URL, API_CONFIG } from './config';

// Create axios instance with production configuration
const api = axios.create({
  ...API_CONFIG,
  // Ensure we're using the correct base URL
  baseURL: API_BASE_URL,
  // Add response type
  responseType: 'json',
});

// Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
        config: response.config
      });
    }
    return response;
  },
  (error) => {
    // Log error details
    console.log('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });

    // Handle 401 Unauthorized - only trigger logout for critical auth failures
    if (error.response?.status === 401) {
      // Check if this is a critical auth failure or just API unavailability
      const isCriticalAuth = error.config?.url?.includes('/auth/') || 
                            error.config?.url?.includes('/verify-token') ||
                            error.response?.data?.error === 'token_expired';
      
      window.dispatchEvent(new CustomEvent('session-invalid', {
        detail: { critical: isCriticalAuth }
      }));
    }
    
    // Handle network errors
    if (!error.response) {
      console.log('Network Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Add request interceptor to include auth token and add request logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    console.log('[API Request Error]', error);
    return Promise.reject(error);
  }
);

export default api;
