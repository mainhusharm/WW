/**
 * API Client with CORS handling
 * Handles CORS issues by using different approaches
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get the current origin
const getCurrentOrigin = () => {
  if (!isBrowser) return '';
  return window.location.origin;
};

// Check if the current origin is allowed by the backend
const isOriginAllowed = () => {
  const origin = getCurrentOrigin();
  const allowedOrigins = [
    'https://frontend-i6xs.onrender.com',
    'https://trading-platform-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  return allowedOrigins.includes(origin);
};

// Get the appropriate API base URL
export const getApiBaseUrl = () => {
  if (!isBrowser) return 'http://localhost:3001';
  
  // If we're in production and origin is not allowed, use a different approach
  if (import.meta.env.PROD && !isOriginAllowed()) {
    // Use working backend
    return 'http://localhost:3001';
  }
  
  // Default to the configured URL
  return import.meta.env.PROD 
    ? 'http://localhost:3001'
    : 'http://localhost:3001';
};

// Make a CORS-safe request
export const makeCorsSafeRequest = async (url: string, options: RequestInit = {}) => {
  const apiBaseUrl = getApiBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  
  // Add CORS headers
  const corsOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
    mode: 'cors',
    credentials: 'omit'
  };
  
  try {
    const response = await fetch(fullUrl, corsOptions);
    return response;
  } catch (error) {
    console.error('CORS request failed:', error);
    throw error;
  }
};

// Alternative: Use a different backend URL that might have better CORS support
export const getAlternativeApiUrl = () => {
  // Try different backend URLs that might work
  const alternatives = [
    'http://localhost:3001',
    'http://localhost:3001',
    'https://trading-platform-api.onrender.com'
  ];
  
  return alternatives[0]; // Use the first one for now
};

// Create a simple CORS proxy using a public service
export const createCorsProxyUrl = (targetUrl: string) => {
  // Use a public CORS proxy service
  return `https://cors-anywhere.herokuapp.com/${targetUrl}`;
};

// Make request with CORS proxy
export const makeRequestWithCorsProxy = async (url: string, options: RequestInit = {}) => {
  const apiBaseUrl = getApiBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  
  // Use CORS proxy
  const proxyUrl = createCorsProxyUrl(fullUrl);
  
  const corsOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {}),
    },
    mode: 'cors',
    credentials: 'omit'
  };
  
  try {
    const response = await fetch(proxyUrl, corsOptions);
    return response;
  } catch (error) {
    console.error('CORS proxy request failed:', error);
    throw error;
  }
};
