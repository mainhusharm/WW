/**
 * CORS Proxy Client - Immediate fix for CORS issues
 * This client uses CORS proxies to bypass CORS restrictions
 */

const BACKEND_URL = 'https://node-backend-g1mk.onrender.com';

// List of CORS proxy services (in order of preference)
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/'
];

/**
 * Make a request using CORS proxy
 */
export const corsProxyRequest = async (url: string, options: RequestInit = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  
  // Clean headers for CORS proxy compatibility
  const cleanHeaders = { ...(options.headers || {}) };
  
  // Remove problematic headers that CORS proxies don't support
  delete cleanHeaders['Authorization'];
  delete cleanHeaders['Access-Control-Request-Method'];
  delete cleanHeaders['Access-Control-Request-Headers'];
  
  // Try each proxy in order
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy === 'https://api.allorigins.win/raw?url=' 
        ? `${proxy}${encodeURIComponent(fullUrl)}`
        : `${proxy}${fullUrl}`;
      
      console.log(`Trying CORS proxy: ${proxy}`);
      
      const response = await fetch(proxyUrl, {
        ...options,
        headers: {
          ...cleanHeaders,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success with proxy: ${proxy}`);
        return { success: true, data, proxy };
      }
    } catch (error) {
      console.log(`❌ Failed with proxy: ${proxy}`, error);
      continue;
    }
  }
  
  throw new Error('All CORS proxies failed');
};

/**
 * Get users using CORS proxy
 */
export const getUsers = async () => {
  try {
    const result = await corsProxyRequest('/api/users');
    return result.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

/**
 * Get user by ID using CORS proxy
 */
export const getUser = async (userId: string) => {
  try {
    const result = await corsProxyRequest(`/api/users/${userId}`);
    return result.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
};

/**
 * Update user status using CORS proxy
 */
export const updateUserStatus = async (userId: string, status: string) => {
  try {
    const result = await corsProxyRequest(`/api/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return result.data;
  } catch (error) {
    console.error('Failed to update user status:', error);
    throw error;
  }
};

/**
 * Health check using CORS proxy
 */
export const healthCheck = async () => {
  try {
    const result = await corsProxyRequest('/health');
    return result.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default {
  getUsers,
  getUser,
  updateUserStatus,
  healthCheck,
  corsProxyRequest
};
