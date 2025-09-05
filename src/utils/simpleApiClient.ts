/**
 * Simple API Client that bypasses CORS issues
 * Uses different approaches to handle CORS problems
 */

// Simple fetch wrapper that handles CORS
export const simpleFetch = async (url: string, options: RequestInit = {}) => {
  const baseUrl = 'https://node-backend-g1mk.onrender.com';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Try different approaches
  const approaches = [
    // Approach 1: Direct request with CORS headers
    {
      name: 'Direct with CORS headers',
      options: {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        mode: 'cors' as RequestMode,
        credentials: 'omit' as RequestCredentials
      }
    },
    // Approach 2: No-CORS mode (limited but works)
    {
      name: 'No-CORS mode',
      options: {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        mode: 'no-cors' as RequestMode
      }
    },
    // Approach 3: Simple request
    {
      name: 'Simple request',
      options: {
        ...options,
        mode: 'cors' as RequestMode
      }
    }
  ];
  
  for (const approach of approaches) {
    try {
      console.log(`Trying ${approach.name}...`);
      const response = await fetch(fullUrl, approach.options);
      
      if (response.ok || response.type === 'opaque') {
        console.log(`✅ ${approach.name} succeeded!`);
        return response;
      }
    } catch (error) {
      console.log(`❌ ${approach.name} failed:`, error);
    }
  }
  
  throw new Error('All approaches failed');
};

// Specific function for getting users
export const getUsers = async () => {
  try {
    const response = await simpleFetch('/api/users', {
      method: 'GET'
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Specific function for user registration
export const registerUser = async (userData: any) => {
  try {
    const response = await simpleFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Specific function for user login
export const loginUser = async (credentials: any) => {
  try {
    const response = await simpleFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};
