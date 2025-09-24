// Environment detection utilities
// Helps determine if we're in production and adjust behavior accordingly

export const isProduction = (): boolean => {
  return window.location.hostname.includes('onrender.com') || 
         window.location.hostname.includes('traderedgepro.com');
};

export const isDevelopment = (): boolean => {
  return window.location.hostname.includes('localhost') || 
         window.location.hostname.includes('127.0.0.1');
};

export const isRender = (): boolean => {
  return window.location.hostname.includes('onrender.com');
};

export const getEnvironment = (): 'development' | 'production' | 'render' => {
  if (isRender()) return 'render';
  if (isProduction()) return 'production';
  return 'development';
};

// Get appropriate API base URL based on environment
export const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  
  if (hostname.includes('onrender.com')) {
    // Use the main backend service
    return 'https://backend-topb.onrender.com';
  } else if (hostname.includes('traderedgepro.com')) {
    // For custom domain, use the main backend service
    return 'https://backend-topb.onrender.com';
  } else if (isDevelopment()) {
    // Development environment - use local enhanced signup handler
    return 'http://localhost:5001';
  }
  
  // Fallback for development
  return 'http://localhost:5001';
};

// Get appropriate CORS proxy based on environment
export const getCorsProxy = (): string => {
  if (isProduction()) {
    // Use more reliable proxies in production
    return 'https://corsproxy.io/?';
  }
  return 'https://api.allorigins.win/raw?url=';
};

// Check if we should use CORS proxies
export const shouldUseCorsProxy = (): boolean => {
  // Always use CORS proxy for external APIs in production
  return isProduction();
};

// Get safe headers for CORS requests
export const getSafeHeaders = (originalHeaders: Record<string, string> | undefined | null = {}): Record<string, string> => {
  // Ensure originalHeaders is always an object
  const safeHeaders = { ...(originalHeaders || {}) };
  
  // Remove headers that cause CORS issues
  delete safeHeaders['Authorization'];
  delete safeHeaders['Access-Control-Request-Method'];
  delete safeHeaders['Access-Control-Request-Headers'];
  
  // Add safe headers
  safeHeaders['Accept'] = 'application/json';
  safeHeaders['Content-Type'] = 'application/json';
  
  return safeHeaders;
};

// Get fallback API configuration for when backend is unavailable
export const getFallbackApiConfig = () => {
  return {
    useLocalStorage: true,
    mockResponses: true,
    enableOfflineMode: true
  };
};

// Check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: getSafeHeaders(),
      mode: 'cors'
    });
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

// Log environment info
export const logEnvironmentInfo = (): void => {
  console.log('🌍 Environment Info:', {
    hostname: window.location.hostname,
    environment: getEnvironment(),
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    isRender: isRender(),
    apiBaseUrl: getApiBaseUrl(),
    corsProxy: getCorsProxy()
  });
};
