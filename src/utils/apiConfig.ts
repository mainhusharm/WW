// API Configuration for TraderEdgePro
// Handles backend-frontend communication

const API_BASE_URLS = {
  development: 'http://localhost:5000',
  production: 'https://backend-topb.onrender.com'
};

const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isDevelopment ? 
  API_BASE_URLS.development : 
  API_BASE_URLS.production;

export const API_ENDPOINTS = {
  SIGNUP: '/api/auth/register',
  PAYMENT: '/api/payments',
  QUESTIONNAIRE: '/api/questionnaire',
  DASHBOARD: '/api/dashboard',
  SIGNALS: '/api/signals',
  HEALTH: '/api/health'
};

// API utility functions
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    console.log(`API Call: ${url}`, finalOptions);
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API Response:`, data);
    return data;
    
  } catch (error) {
    console.error(`API Error for ${url}:`, error);
    throw error;
  }
};

// Specific API functions
export const signupUser = async (userData) => {
  return apiCall(API_ENDPOINTS.SIGNUP, {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

export const processPayment = async (paymentData) => {
  return apiCall(API_ENDPOINTS.PAYMENT, {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
};

export const saveQuestionnaire = async (questionnaireData) => {
  return apiCall(API_ENDPOINTS.QUESTIONNAIRE, {
    method: 'POST',
    body: JSON.stringify(questionnaireData)
  });
};

export const getDashboardData = async (email) => {
  return apiCall(`${API_ENDPOINTS.DASHBOARD}/${email}`);
};

export const getSignals = async () => {
  return apiCall(API_ENDPOINTS.SIGNALS);
};

export const checkHealth = async () => {
  return apiCall(API_ENDPOINTS.HEALTH);
};
