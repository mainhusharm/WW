import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../api';

export interface User {
  uniqueId?: string;
  id?: string;
  name?: string;
  email?: string;
  membershipTier?: string;
  accountType?: 'personal' | 'business';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  isAuthenticated: boolean;
  setupComplete?: boolean;
  selectedPlan?: any;
  token?: string;
  isTemporary?: boolean;
  tradingData?: {
    propFirm: string;
    accountType: string;
    accountSize: string;
    riskPerTrade: string;
    riskRewardRatio: string;
    tradesPerDay: string;
    tradingExperience: string;
    tradingSession: string;
    cryptoAssets: string[];
    forexAssets: string[];
    hasAccount: string;
  };
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  login: (userData: Omit<User, 'isAuthenticated' | 'membershipTier'>, token: string, rememberMe?: boolean) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const storedUser = localStorage.getItem('current_user');
        const storedToken = localStorage.getItem('access_token');
        const sessionToken = sessionStorage.getItem('session_token');
        const rememberMe = localStorage.getItem('remember_me') === 'true';
        
        // Use stored token or session token based on remember me preference
        const activeToken = storedToken || sessionToken;
        
        if (storedUser && activeToken) {
          const parsedUser = JSON.parse(storedUser);
          
          // Set up API authorization
          if (activeToken && typeof activeToken === 'string' && !activeToken.startsWith('demo-token')) {
            api.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
            
            // Fetch fresh user profile data from backend
            try {
              const profileResponse = await api.get('/user/profile');
              if (profileResponse.data) {
                const backendUserData = profileResponse.data;
                
                // Merge backend data with stored data
                const mergedUserData = {
                  ...parsedUser,
                  ...backendUserData,
                  isAuthenticated: true,
                  token: activeToken,
                  setupComplete: !!backendUserData.tradingData,
                  rememberMe
                };
                
                // Update stored user data with fresh backend data
                localStorage.setItem('current_user', JSON.stringify(mergedUserData));
                setUser(mergedUserData);
                setIsLoading(false);
                return;
              }
            } catch (profileError) {
              console.warn('Could not fetch user profile from backend:', profileError);
              // Continue with stored data if backend is unavailable
            }
          }
          
          // Check if user has completed setup by looking for trading plan data
          const hasCompletedSetup = parsedUser.setupComplete || 
            localStorage.getItem('questionnaireAnswers') || 
            localStorage.getItem('tradingPlan') ||
            parsedUser.tradingData;

          // Restore user data from backup if available (for returning users)
          const backupData = localStorage.getItem(`user_backup_${parsedUser.email}`);
          let restoredUserData = parsedUser;
          
          if (backupData) {
            try {
              const backup = JSON.parse(backupData);
              // Merge backup data with current user data
              restoredUserData = {
                ...backup,
                ...parsedUser,
                token: activeToken,
                isAuthenticated: true,
                setupComplete: hasCompletedSetup
              };
            } catch (backupError) {
              console.warn('Could not restore backup data:', backupError);
            }
          }

          const userData = { 
            ...restoredUserData, 
            isAuthenticated: true, 
            token: activeToken,
            setupComplete: hasCompletedSetup,
            rememberMe
          };
          
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    const handleSessionInvalid = (event: any) => {
      // Only logout for critical auth errors, not for general API failures
      if (event.detail?.critical === true) {
        logout();
        alert('Your session has expired. Please log in again.');
      } else {
        // For non-critical errors, just log and continue
        console.warn('API authentication issue, but keeping user logged in');
      }
    };

    window.addEventListener('session-invalid', handleSessionInvalid);

    return () => {
      window.removeEventListener('session-invalid', handleSessionInvalid);
    };
  }, []);

  const login = (userData: Omit<User, 'isAuthenticated' | 'membershipTier'>, token: string, rememberMe = false) => {
    let plan = 'professional';
    let name = userData.name;
    
    // Only decode JWT if it's not a demo token
    if (token && typeof token === 'string' && !token.startsWith('demo-token')) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decodedToken = JSON.parse(jsonPayload);
        plan = decodedToken.plan_type || 'professional';
        name = decodedToken.username || userData.name || userData.email;
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    const updatedUserData = {
      ...userData,
      name,
      membershipTier: plan,
    };

    const finalUserData = { 
      ...updatedUserData, 
      membershipTier: plan as any, 
      isAuthenticated: true, 
      setupComplete: userData.setupComplete || false,
      token 
    };

    // Store user data with email as key for persistence
    localStorage.setItem('current_user', JSON.stringify(finalUserData));
    localStorage.setItem(`user_profile_${userData.email}`, JSON.stringify(finalUserData));
    
    // Use rememberMe to determine token storage strategy
    if (rememberMe) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('remember_me', 'true');
    } else {
      localStorage.setItem('access_token', token);
      sessionStorage.setItem('session_token', token);
    }
    
    // Only set API auth for real tokens
    if (token && typeof token === 'string' && !token.startsWith('demo-token')) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setUser(finalUserData);
  };

  const logout = () => {
    // Save current user data before logout for restoration
    if (user?.email) {
      const userDataToSave = {
        ...user,
        lastLogoutTime: new Date().toISOString(),
        dashboardState: {
          activeTab: localStorage.getItem(`dashboard_active_tab_${user.email}`),
          selectedTimezone: localStorage.getItem(`dashboard_timezone_${user.email}`),
          preferences: localStorage.getItem(`dashboard_preferences_${user.email}`)
        }
      };
      localStorage.setItem(`user_backup_${user.email}`, JSON.stringify(userDataToSave));
      
      // Keep all user-specific data intact for restoration
      // Preserve: dashboard_data_${user.email}, trading_state_${user.email}, 
      // questionnaireAnswers, riskManagementPlan, tradingPlan
    }
    
    // Only remove auth tokens and current session
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('session_token');
    sessionStorage.removeItem('user_session');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const saveUserProgress = async (userData: User) => {
    if (userData.email) {
      try {
        await api.post('/api/user/progress', {
          email: userData.email,
          progress: userData,
        });
      } catch (error) {
        console.error('Failed to save user progress:', error);
      }
    }
  };

  useEffect(() => {
    if (user) {
      saveUserProgress(user);
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, logout, login, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
