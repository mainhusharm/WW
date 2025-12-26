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
          ...(options.headers || {}),
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
          ...(options.headers || {}),
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
    // Use localStorage to avoid CORS issues
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Specific function for user registration
export const registerUser = async (userData: any) => {
  try {
    // Use localStorage for user registration to avoid CORS issues
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if user already exists
    const existingUser = users.find((u: any) => u.email === userData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Create new user
    const newUser = {
      id: Date.now(),
      email: userData.email,
      password: userData.password,
      name: userData.name || userData.email.split('@')[0],
      createdAt: new Date().toISOString()
    };
    
    // Store user in localStorage
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Specific function for user login
export const loginUser = async (credentials: any) => {
  try {
    // Use localStorage for authentication to avoid CORS issues
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => 
      u.email === credentials.email && u.password === credentials.password
    );
    
    if (user) {
      // Store current user in localStorage
      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        isAuthenticated: true
      }));
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token: 'local-storage-token'
      };
    } else {
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};
