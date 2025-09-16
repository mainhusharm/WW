// Mock Data Service for Admin Dashboard
// This prevents CORS errors by providing mock data instead of API calls

export const mockUserProfile = {
  id: 'admin-user-1',
  username: 'admin',
  email: 'admin@traderedgepro.com',
  plan_type: 'professional',
  membershipTier: 'professional',
  created_at: new Date().toISOString(),
  last_login: new Date().toISOString()
};

export const mockUserProgress = {
  current_lesson: 5,
  completed_lessons: 4,
  total_lessons: 10,
  progress_percentage: 40,
  last_updated: new Date().toISOString()
};

export const mockBotStatus = {
  status: 'running',
  uptime: '2 days, 5 hours',
  last_signal: new Date().toISOString(),
  total_signals: 156,
  active_signals: 3,
  success_rate: 78.5,
  last_updated: new Date().toISOString()
};

export const mockDatabaseStats = {
  total_users: 1247,
  active_users: 892,
  total_signals: 3456,
  active_signals: 23,
  total_trades: 1234,
  successful_trades: 987,
  success_rate: 80.1,
  total_revenue: 45678.90,
  last_updated: new Date().toISOString()
};

export const mockTradingData = {
  account_value: 10000,
  total_pnl: 1250.75,
  win_rate: 78.5,
  total_trades: 45,
  active_signals: 3,
  daily_pnl: 125.50,
  weekly_pnl: 450.25,
  monthly_pnl: 1250.75
};

// Mock API functions that return data instead of making requests
export const mockApiCalls = {
  getUserProfile: async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return { success: true, data: mockUserProfile };
  },
  
  getUserProgress: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, data: mockUserProgress };
  },
  
  getBotStatus: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { success: true, data: mockBotStatus };
  },
  
  getDatabaseStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return { success: true, data: mockDatabaseStats };
  },
  
  getTradingData: async () => {
    await new Promise(resolve => setTimeout(resolve, 350));
    return { success: true, data: mockTradingData };
  }
};

// Override fetch for admin dashboard to use mock data
export const setupAdminMockData = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (url: string | URL, options?: RequestInit) => {
    const urlString = url.toString();
    
    // Check if this is an admin dashboard request
    if (urlString.includes('/user/profile')) {
      const result = await mockApiCalls.getUserProfile();
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(result.data)
      } as Response;
    }
    
    if (urlString.includes('/user/progress')) {
      const result = await mockApiCalls.getUserProgress();
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(result.data)
      } as Response;
    }
    
    if (urlString.includes('/api/database/bot-status')) {
      const result = await mockApiCalls.getBotStatus();
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(result.data)
      } as Response;
    }
    
    if (urlString.includes('/api/database/stats')) {
      const result = await mockApiCalls.getDatabaseStats();
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(result.data)
      } as Response;
    }
    
    if (urlString.includes('/api/dashboard/trading-data')) {
      const result = await mockApiCalls.getTradingData();
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(result.data)
      } as Response;
    }
    
    // For all other requests, use original fetch
    return originalFetch(url, options);
  };
  
  console.log('✅ Admin mock data service activated - CORS errors prevented');
};
