// Dynamic API URL configuration with better error handling
const getApiBaseUrl = () => {
  const isDev = import.meta.env.DEV;
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isAmplify = hostname.includes('amplifyapp.com');

  if (isDev || isLocal) {
    // Development environment - use local backend if available
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
    console.log('API Base URL (dev):', apiUrl, { isDev, isLocal, isAmplify, hostname });
    return apiUrl;
  }

  // Production: use environment variable or fallback to relative path
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  
  // If we have a specific API URL from environment, use it
  if (fromEnv && fromEnv.trim().length > 0 && fromEnv !== 'https://forex-data-service.onrender.com') {
    console.log('API Base URL (prod from env):', fromEnv);
    return fromEnv;
  }
  
  // For production deployment, use relative path to avoid CORS issues
  const apiUrl = '/api';
  console.log('API Base URL (prod relative):', apiUrl, {
    fromEnv,
    NODE_ENV: process.env.NODE_ENV,
    isDev,
    isLocal,
    isAmplify,
    hostname
  });
  return apiUrl;
};

// Export the base URL directly
const API_BASE_URL = getApiBaseUrl();

// Log the API base URL when the module loads
console.log('API Configuration Initialized:', {
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  VITE_API_URL: import.meta.env.VITE_API_URL
});

export { API_BASE_URL };

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: false, // Disable for cross-origin requests to prevent CORS issues
  maxRedirects: 0, // Prevent automatic redirects that convert POST to GET
  validateStatus: function (status: number) {
    return status >= 200 && status < 500; // Accept more status codes to handle gracefully
  }
};

// Environment-specific settings
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: API_BASE_URL,
  // Fallback URLs for different services
  forexDataServiceUrl: 'https://forex-data-service.onrender.com',
  customerServiceUrl: 'http://localhost:5001',
};
