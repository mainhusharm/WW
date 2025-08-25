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

// Add a response interceptor for global error handling with better fallbacks
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
    // Log error details only in development to reduce console noise in production
    if (import.meta.env.DEV) {
      console.log('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
    }

    // Handle different types of errors gracefully
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      
      if (status === 401) {
        // Check if this is a critical auth failure or just API unavailability
        const isCriticalAuth = error.config?.url?.includes('/auth/') || 
                              error.config?.url?.includes('/verify-token') ||
                              error.response?.data?.error === 'token_expired';
        
        if (isCriticalAuth) {
          window.dispatchEvent(new CustomEvent('session-invalid', {
            detail: { critical: true }
          }));
        }
      } else if (status >= 500) {
        // Server errors - provide fallback data where possible
        console.warn(`Server error ${status} for ${error.config?.url}`);
        
        // For specific endpoints, return fallback data instead of throwing
        if (error.config?.url?.includes('/signals')) {
          return Promise.resolve({
            data: [],
            status: 200,
            statusText: 'OK (fallback)',
            headers: {},
            config: error.config
          });
        }
        
        if (error.config?.url?.includes('/customers')) {
          return Promise.resolve({
            data: [],
            status: 200,
            statusText: 'OK (fallback)',
            headers: {},
            config: error.config
          });
        }
      }
    } else if (error.request) {
      // Network error - no response received
      console.warn('Network Error:', error.message);
      
      // For critical endpoints, return empty data instead of failing
      if (error.config?.url?.includes('/signals') || error.config?.url?.includes('/customers')) {
        return Promise.resolve({
          data: [],
          status: 200,
          statusText: 'OK (network fallback)',
          headers: {},
          config: error.config
        });
      }
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
