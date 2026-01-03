import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../lib/api';
import { productionApi, isProductionBackendUnavailable } from '../utils/productionFallback';

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
    let timeoutId: NodeJS.Timeout;
    
    const initializeUser = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, 3000); // 3 second timeout
        
        const storedUser = localStorage.getItem('current_user');
        const storedToken = localStorage.getItem('access_token');
        const sessionToken = sessionStorage.getItem('session_token');
        const rememberMe = localStorage.getItem('remember_me') === 'true';
        
        // Use stored token or session token based on remember me preference
        const activeToken = storedToken || sessionToken;
        
        if (storedUser && activeToken) {
          const parsedUser = JSON.parse(storedUser);
          
          // Load questionnaire data from localStorage to ensure data persistence
          const questionnaireAnswers = localStorage.getItem('questionnaireAnswers');
          let tradingData = parsedUser.tradingData;
          
          if (questionnaireAnswers) {
            try {
              const answers = JSON.parse(questionnaireAnswers);
              // Check if answers is valid and has required properties
              if (answers && typeof answers === 'object') {
                // Ensure account size is stored as exact number without rounding
                tradingData = {
                  propFirm: answers.propFirm || '',
                accountType: answers.accountType || '',
                accountSize: String(answers.accountSize), // Keep as string to preserve exact value
                riskPerTrade: String(answers.riskPercentage || 1),
                riskRewardRatio: answers.riskRewardRatio || '2',
                tradesPerDay: answers.tradesPerDay || '1-2',
                tradingSession: answers.tradingSession || 'any',
                cryptoAssets: answers.cryptoAssets || [],
                forexAssets: answers.forexAssets || [],
                hasAccount: answers.hasAccount || 'no',
                tradingExperience: answers.tradingExperience || 'intermediate'
              };
              
                // Also update the user's stored data with the questionnaire data
                parsedUser.tradingData = tradingData;
                console.log('Loaded questionnaire data for user:', tradingData);
              }
            } catch (parseError) {
              console.warn('Could not parse questionnaire answers:', parseError);
            }
          } else {
            // If no questionnaire data found, check if user has completed questionnaire
            const questionnaireCompleted = localStorage.getItem('questionnaire_completed');
            if (questionnaireCompleted === 'true') {
              console.warn('Questionnaire marked as completed but no data found in localStorage');
            }
          }
          
          // Set up API authorization
          if (activeToken && typeof activeToken === 'string' && !activeToken.startsWith('demo-token')) {
            // Note: Custom api client doesn't have defaults property like axios
            console.log('Token available for API authorization:', activeToken.substring(0, 10) + '...');
            
            // Fetch fresh user profile data from backend with fallback
            try {
              const backendUserData = await productionApi.getUserProfile();
              if (backendUserData) {
                
                // Merge backend data with stored data, preferring complete database data
                const finalTradingData = tradingData && tradingData.accountSize && tradingData.propFirm 
                  ? tradingData  // Use local data if it's complete
                  : backendUserData.tradingData; // Otherwise use database data
                
                const mergedUserData = {
                  ...parsedUser,
                  ...backendUserData,
                  tradingData: finalTradingData,
                  isAuthenticated: true,
                  token: activeToken,
                  setupComplete: !!finalTradingData,
                  rememberMe
                };
                
                // Update stored user data with fresh backend data
                localStorage.setItem('current_user', JSON.stringify(mergedUserData));
                setUser(mergedUserData);
                setIsLoading(false);
                return;
              }
            } catch (profileError: any) {
              if (isProductionBackendUnavailable(profileError)) {
                console.log('🔄 Using fallback user profile for production');
              } else if (profileError.response?.status === 404) {
                console.warn('User profile endpoint not found, using stored data');
              } else {
                console.warn('Could not fetch user profile from backend:', profileError);
              }
              // Continue with stored data if backend is unavailable
            }
          }
          
          // Check if user has completed setup by looking for trading plan data
          const hasCompletedSetup = parsedUser.setupComplete || 
            questionnaireAnswers || 
            localStorage.getItem('tradingPlan') ||
            tradingData;

          // Restore user data from backup if available (for returning users)
          const backupData = localStorage.getItem(`user_backup_${parsedUser.email}`);
          let restoredUserData = parsedUser;
          
          if (backupData) {
            try {
              const backup = JSON.parse(backupData);
              // Merge backup data with current user data, preserving questionnaire data
              restoredUserData = {
                ...backup,
                ...parsedUser,
                tradingData: tradingData || backup.tradingData, // Prefer current questionnaire data
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
            tradingData: tradingData || restoredUserData.tradingData, // Ensure trading data is included
            isAuthenticated: true, 
            token: activeToken,
            setupComplete: hasCompletedSetup,
            rememberMe
          };
          
          // Update the stored user data with the loaded questionnaire data
          if (tradingData) {
            userData.tradingData = tradingData;
            // Also update the stored user data in localStorage
            localStorage.setItem('current_user', JSON.stringify(userData));
          }
          
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        clearTimeout(timeoutId);
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
    console.log('🔐 UserContext login called with:', { userData, token, rememberMe });

    let plan = 'professional';
    let name = userData.name;

    // Only decode JWT if it's not a demo token and it's a valid JWT structure
    if (token && typeof token === 'string' && !token.startsWith('demo-token') && token.split('.').length === 3) {
      try {
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              // Ensure 'c' is a valid character before calling charCodeAt(0)
              if (typeof c === 'string' && c.length > 0) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }
              return ''; // Return empty string for invalid characters
          }).join(''));
          const decodedToken = JSON.parse(jsonPayload);
          plan = decodedToken.plan_type || 'professional';
          name = decodedToken.username || userData.name || userData.email;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        // Continue with default values if decoding fails
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

    console.log('💾 Storing user data:', finalUserData);

    // Store user data with email as key for persistence
    localStorage.setItem('current_user', JSON.stringify(finalUserData));
    localStorage.setItem(`user_profile_${userData.email}`, JSON.stringify(finalUserData));

    // Use rememberMe to determine token storage strategy
    if (rememberMe) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('remember_me', 'true');
      console.log('💾 Stored token in localStorage (remember me)');
    } else {
      localStorage.setItem('access_token', token);
      sessionStorage.setItem('session_token', token);
      console.log('💾 Stored token in localStorage and sessionStorage');
    }

    // Only set API auth for real tokens
    if (token && typeof token === 'string' && !token.startsWith('demo-token')) {
      // Note: Custom api client handles auth differently
      console.log('Token available for API authorization:', token.substring(0, 10) + '...');
    }

    console.log('🔄 Setting user state:', finalUserData);
    setUser(finalUserData);
    console.log('✅ UserContext login completed');
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
    // Note: Custom api client doesn't use defaults property like axios
    setUser(null);
  };

  const saveUserProgress = async (userData: User) => {
    if (userData.email) {
      try {
        await productionApi.saveUserProgress({
          email: userData.email,
          progress: userData,
        });
      } catch (error: any) {
        if (isProductionBackendUnavailable(error)) {
          console.log('🔄 User progress saved locally for production');
        } else if (error.response?.status === 404) {
          console.warn('User progress endpoint not found, skipping save');
        } else {
          console.error('Failed to save user progress:', error);
        }
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
