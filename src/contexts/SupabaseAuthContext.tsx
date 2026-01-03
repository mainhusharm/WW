import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { UserProfile } from '../lib/supabase';

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: Partial<UserProfile>) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ userProfile: UserProfile | null; error: any }>;
  refreshProfile: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state with timeout fallback
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Auth initialization timeout - falling back to unauthenticated state');
            setLoading(false);
          }
        }, 10000); // 10 second timeout

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('Supabase auth error:', error.message);
          if (isMounted) setLoading(false);
          return;
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.warn('Auth initialization failed:', error);
        if (isMounted) setLoading(false);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    initializeAuth();

    // Listen for auth changes
    let subscription: any = null;
    try {
      const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setUserProfile(null);
            setLoading(false);
          }
        }
      });
      subscription = authListener.data.subscription;
    } catch (error) {
      console.warn('Auth listener setup failed:', error);
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await supabaseService.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Try to get profile by email if not found by ID
      if (user?.email) {
        try {
          const profile = await supabaseService.getUserProfileByEmail(user.email);
          setUserProfile(profile);
        } catch (emailError) {
          console.error('Error loading user profile by email:', emailError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create user profile if signup successful and user data provided
      if (data.user && userData) {
        try {
          const profileData = {
            id: data.user.id,
            email,
            name: userData.name || '',
            phone: userData.phone || undefined,
            company: userData.company || undefined,
            country: userData.country || 'United States',
            language: userData.language || 'English',
            bio: userData.bio || undefined,
            unique_id: userData.unique_id || `user_${Date.now()}`,
            membership_tier: userData.membership_tier || 'basic',
            setup_complete: false,
          };

          await supabaseService.createUserProfile(profileData);
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't fail signup if profile creation fails
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      return { userProfile: null, error: 'No user logged in' };
    }

    try {
      const updatedProfile = await supabaseService.updateUserProfile(user.id, updates);
      setUserProfile(updatedProfile);
      return { userProfile: updatedProfile, error: null };
    } catch (error) {
      return { userProfile: null, error };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  };

  const value: SupabaseAuthContextType = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = (): SupabaseAuthContextType => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
