import { createClient } from '@supabase/supabase-js'

// Supabase configuration with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bgejxnkyzjamroeikfkr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk'

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
}

// Create Supabase client with robust error handling and production safeguards
let supabase: any = null;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false // Disable for production stability
    },
    global: {
      headers: {
        'X-Client-Info': 'trading-platform',
        'User-Agent': 'TraderEdge-Pro/1.0.0'
      },
      fetch: (url, options = {}) => {
        // Add production-safe fetch wrapper
        const safeOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        };
        
        // Ensure headers object exists
        if (!safeOptions.headers) {
          safeOptions.headers = {};
        }
        
        return fetch(url, safeOptions).catch(error => {
          console.error('❌ Supabase fetch error:', error);
          throw error;
        });
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  });
  
  console.log('✅ Supabase client created successfully');
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  
  // Create a fallback mock client to prevent crashes
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase unavailable' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase unavailable' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Supabase unavailable' } }),
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase unavailable' } })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  };
}

export { supabase };

// Safe connection test with timeout
if (typeof window !== 'undefined' && supabase) {
  // Wait for DOM to be ready before testing connection
  const testConnection = () => {
    try {
      const connectionTest = Promise.race([
        supabase.from('User details').select('count', { count: 'exact', head: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
      ]);
      
      connectionTest
        .then((result) => {
          if (result && !result.error) {
            console.log('✅ Supabase connection successful');
          } else {
            console.warn('⚠️ Supabase connection warning:', result?.error);
          }
        })
        .catch((error) => {
          console.warn('⚠️ Supabase connection test failed (app will use fallback):', error);
        });
    } catch (error) {
      console.warn('⚠️ Supabase connection test error:', error);
    }
  };

  // Test connection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testConnection);
  } else {
    // DOM is already loaded
    setTimeout(testConnection, 100);
  }
}

// Database types
export interface Database {
  public: {
    Tables: {
      "User details": {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          company: string | null
          country: string | null
          language: string | null
          password_hash: string | null
          agree_to_terms: boolean
          agree_to_marketing: boolean
          trading_experience_signup: string | null
          trading_goals_signup: string | null
          risk_tolerance_signup: string | null
          preferred_markets: string | null
          trading_style: string | null
          status: string
          membership_tier: string | null
          account_type: string | null
          setup_complete: boolean
          is_temporary: boolean
          unique_id: string | null
          token: string | null
          selected_plan: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          company?: string | null
          country?: string | null
          language?: string | null
          password_hash?: string | null
          agree_to_terms?: boolean
          agree_to_marketing?: boolean
          trading_experience_signup?: string | null
          trading_goals_signup?: string | null
          risk_tolerance_signup?: string | null
          preferred_markets?: string | null
          trading_style?: string | null
          status?: string
          membership_tier?: string | null
          account_type?: string | null
          setup_complete?: boolean
          is_temporary?: boolean
          unique_id?: string | null
          token?: string | null
          selected_plan?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          company?: string | null
          country?: string | null
          language?: string | null
          password_hash?: string | null
          agree_to_terms?: boolean
          agree_to_marketing?: boolean
          trading_experience_signup?: string | null
          trading_goals_signup?: string | null
          risk_tolerance_signup?: string | null
          preferred_markets?: string | null
          trading_style?: string | null
          status?: string
          membership_tier?: string | null
          account_type?: string | null
          setup_complete?: boolean
          is_temporary?: boolean
          unique_id?: string | null
          token?: string | null
          selected_plan?: any | null
          created_at?: string
          updated_at?: string
        }
      },
      "payment details": {
        Row: {
          id: string
          user_id: string
          user_email: string
          user_name: string
          plan_name: string
          original_price: number
          discount_amount: number
          final_price: number
          coupon_code: string | null
          payment_method: string
          transaction_id: string | null
          payment_status: string
          payment_provider: string | null
          payment_provider_id: string | null
          currency: string
          country: string | null
          company: string | null
          phone: string | null
          payment_data: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          user_name: string
          plan_name: string
          original_price: number
          discount_amount: number
          final_price: number
          coupon_code?: string | null
          payment_method: string
          transaction_id?: string | null
          payment_status: string
          payment_provider?: string | null
          payment_provider_id?: string | null
          currency: string
          country?: string | null
          company?: string | null
          phone?: string | null
          payment_data?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          user_name?: string
          plan_name?: string
          original_price?: number
          discount_amount?: number
          final_price?: number
          coupon_code?: string | null
          payment_method?: string
          transaction_id?: string | null
          payment_status?: string
          payment_provider?: string | null
          payment_provider_id?: string | null
          currency?: string
          country?: string | null
          company?: string | null
          phone?: string | null
          payment_data?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string | null
          plan_type: string
          status: string
          questionnaire_data: any | null
          risk_management_plan: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          full_name?: string | null
          plan_type?: string
          status?: string
          questionnaire_data?: any | null
          risk_management_plan?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string | null
          plan_type?: string
          status?: string
          questionnaire_data?: any | null
          risk_management_plan?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      questionnaire_responses: {
        Row: {
          id: string
          user_id: string
          has_account: string
          prop_firm: string
          account_type: string
          account_size: number
          risk_percentage: number
          risk_reward_ratio: string
          trading_experience: string
          risk_tolerance: string
          trading_goals: string
          trades_per_day: string
          trading_session: string
          crypto_assets: string[]
          forex_assets: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          has_account: string
          prop_firm: string
          account_type: string
          account_size: number
          risk_percentage: number
          risk_reward_ratio: string
          trading_experience: string
          risk_tolerance: string
          trading_goals: string
          trades_per_day: string
          trading_session: string
          crypto_assets: string[]
          forex_assets: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          has_account?: string
          prop_firm?: string
          account_type?: string
          account_size?: number
          risk_percentage?: number
          risk_reward_ratio?: string
          trading_experience?: string
          risk_tolerance?: string
          trading_goals?: string
          trades_per_day?: string
          trading_session?: string
          crypto_assets?: string[]
          forex_assets?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      risk_management_plans: {
        Row: {
          id: string
          user_id: string
          risk_per_trade: number
          daily_loss_limit: number
          max_loss: number
          profit_target: number
          trades_to_pass: number
          risk_amount: number
          profit_amount: number
          consecutive_losses_limit: number
          generated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          risk_per_trade: number
          daily_loss_limit: number
          max_loss: number
          profit_target: number
          trades_to_pass: number
          risk_amount: number
          profit_amount: number
          consecutive_losses_limit: number
          generated_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          risk_per_trade?: number
          daily_loss_limit?: number
          max_loss?: number
          profit_target?: number
          trades_to_pass?: number
          risk_amount?: number
          profit_amount?: number
          consecutive_losses_limit?: number
          generated_at?: string
          created_at?: string
          updated_at?: string
        }
      },
      "questionnaire details": {
        Row: {
          id: string
          user_id: string
          user_email: string
          user_name: string
          trades_per_day: string
          max_trades_per_day: number
          trading_session: string
          session_recommendation: string
          prop_firm: string
          account_type: string
          has_account: string
          account_equity: number
          account_number: string | null
          account_screenshot: string | null
          screenshot_filename: string | null
          screenshot_size: number | null
          screenshot_type: string | null
          crypto_assets: string[]
          forex_assets: string[]
          daily_profit_target: number
          daily_risk_amount: number
          estimated_days_to_pass: number
          trade_by_trade_plan: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          user_name: string
          trades_per_day: string
          max_trades_per_day: number
          trading_session: string
          session_recommendation: string
          prop_firm: string
          account_type: string
          has_account: string
          account_equity: number
          account_number?: string | null
          account_screenshot?: string | null
          screenshot_filename?: string | null
          screenshot_size?: number | null
          screenshot_type?: string | null
          crypto_assets: string[]
          forex_assets: string[]
          daily_profit_target: number
          daily_risk_amount: number
          estimated_days_to_pass: number
          trade_by_trade_plan?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          user_name?: string
          trades_per_day?: string
          max_trades_per_day?: number
          trading_session?: string
          session_recommendation?: string
          prop_firm?: string
          account_type?: string
          has_account?: string
          account_equity?: number
          account_number?: string | null
          account_screenshot?: string | null
          screenshot_filename?: string | null
          screenshot_size?: number | null
          screenshot_type?: string | null
          crypto_assets?: string[]
          forex_assets?: string[]
          daily_profit_target?: number
          daily_risk_amount?: number
          estimated_days_to_pass?: number
          trade_by_trade_plan?: any | null
          created_at?: string
          updated_at?: string
        }
      },
      "user dashboard": {
        Row: {
          id: string
          user_id: string
          user_email: string
          user_name: string
          prop_firm: string | null
          account_type: string | null
          account_size: number | null
          risk_per_trade: number | null
          experience: string | null
          unique_id: string | null
          account_balance: number | null
          total_pnl: number
          win_rate: number
          total_trades: number
          winning_trades: number
          losing_trades: number
          average_win: number
          average_loss: number
          profit_factor: number
          max_drawdown: number
          current_drawdown: number
          gross_profit: number
          gross_loss: number
          consecutive_wins: number
          consecutive_losses: number
          sharpe_ratio: number | null
          max_daily_risk: number | null
          risk_per_trade_amount: number | null
          max_drawdown_limit: number | null
          initial_equity: number | null
          current_equity: number | null
          daily_pnl: number
          daily_trades: number
          daily_initial_equity: number | null
          risk_per_trade_percentage: number | null
          daily_loss_limit: number | null
          consecutive_losses_limit: number | null
          selected_theme: string
          notifications_enabled: boolean
          auto_refresh: boolean
          refresh_interval: number
          language: string
          timezone: string
          real_time_data: any | null
          last_signal: any | null
          market_status: string
          connection_status: string
          open_positions: any[]
          trade_history: any[]
          signals: any[]
          dashboard_layout: any | null
          widget_settings: any | null
          alert_settings: any | null
          last_activity: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          user_name: string
          prop_firm?: string | null
          account_type?: string | null
          account_size?: number | null
          risk_per_trade?: number | null
          experience?: string | null
          unique_id?: string | null
          account_balance?: number | null
          total_pnl?: number
          win_rate?: number
          total_trades?: number
          winning_trades?: number
          losing_trades?: number
          average_win?: number
          average_loss?: number
          profit_factor?: number
          max_drawdown?: number
          current_drawdown?: number
          gross_profit?: number
          gross_loss?: number
          consecutive_wins?: number
          consecutive_losses?: number
          sharpe_ratio?: number | null
          max_daily_risk?: number | null
          risk_per_trade_amount?: number | null
          max_drawdown_limit?: number | null
          initial_equity?: number | null
          current_equity?: number | null
          daily_pnl?: number
          daily_trades?: number
          daily_initial_equity?: number | null
          risk_per_trade_percentage?: number | null
          daily_loss_limit?: number | null
          consecutive_losses_limit?: number | null
          selected_theme?: string
          notifications_enabled?: boolean
          auto_refresh?: boolean
          refresh_interval?: number
          language?: string
          timezone?: string
          real_time_data?: any | null
          last_signal?: any | null
          market_status?: string
          connection_status?: string
          open_positions?: any[]
          trade_history?: any[]
          signals?: any[]
          dashboard_layout?: any | null
          widget_settings?: any | null
          alert_settings?: any | null
          last_activity?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          user_name?: string
          prop_firm?: string | null
          account_type?: string | null
          account_size?: number | null
          risk_per_trade?: number | null
          experience?: string | null
          unique_id?: string | null
          account_balance?: number | null
          total_pnl?: number
          win_rate?: number
          total_trades?: number
          winning_trades?: number
          losing_trades?: number
          average_win?: number
          average_loss?: number
          profit_factor?: number
          max_drawdown?: number
          current_drawdown?: number
          gross_profit?: number
          gross_loss?: number
          consecutive_wins?: number
          consecutive_losses?: number
          sharpe_ratio?: number | null
          max_daily_risk?: number | null
          risk_per_trade_amount?: number | null
          max_drawdown_limit?: number | null
          initial_equity?: number | null
          current_equity?: number | null
          daily_pnl?: number
          daily_trades?: number
          daily_initial_equity?: number | null
          risk_per_trade_percentage?: number | null
          daily_loss_limit?: number | null
          consecutive_losses_limit?: number | null
          selected_theme?: string
          notifications_enabled?: boolean
          auto_refresh?: boolean
          refresh_interval?: number
          language?: string
          timezone?: string
          real_time_data?: any | null
          last_signal?: any | null
          market_status?: string
          connection_status?: string
          open_positions?: any[]
          trade_history?: any[]
          signals?: any[]
          dashboard_layout?: any | null
          widget_settings?: any | null
          alert_settings?: any | null
          last_activity?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Type helpers
export type UserDetails = Database['public']['Tables']['User details']['Row']
export type PaymentDetails = Database['public']['Tables']['payment details']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type QuestionnaireResponse = Database['public']['Tables']['questionnaire_responses']['Row']
export type RiskManagementPlan = Database['public']['Tables']['risk_management_plans']['Row']
export type QuestionnaireDetails = Database['public']['Tables']['questionnaire details']['Row']
export type UserDashboard = Database['public']['Tables']['user dashboard']['Row']

// API functions
export const supabaseApi = {
  // User Details (Signup Data)
  async getUserDetails() {
    const { data, error } = await supabase
      .from('User details')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getUserDetail(id: string) {
    const { data, error } = await supabase
      .from('User details')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createUserDetail(userData: Database['public']['Tables']['User details']['Insert']) {
    const { data, error } = await supabase
      .from('User details')
      .insert(userData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateUserDetail(id: string, updates: Database['public']['Tables']['User details']['Update']) {
    const { data, error } = await supabase
      .from('User details')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteUserDetail(id: string) {
    const { error } = await supabase
      .from('User details')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Payment Details
  async getPaymentDetails() {
    const { data, error } = await supabase
      .from('payment details')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getPaymentDetail(id: string) {
    const { data, error } = await supabase
      .from('payment details')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createPaymentDetail(paymentData: any) {
    const { data, error } = await supabase
      .from('payment details')
      .insert(paymentData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePaymentDetail(id: string, updates: any) {
    const { data, error } = await supabase
      .from('payment details')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deletePaymentDetail(id: string) {
    const { error } = await supabase
      .from('payment details')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Users
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        questionnaire_responses(*),
        risk_management_plans(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        questionnaire_responses(*),
        risk_management_plans(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createUser(userData: Database['public']['Tables']['users']['Insert']) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateUser(id: string, updates: Database['public']['Tables']['users']['Update']) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Questionnaire Details
  async getQuestionnaireDetails() {
    const { data, error } = await supabase
      .from('questionnaire details')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getQuestionnaireDetail(id: string) {
    const { data, error } = await supabase
      .from('questionnaire details')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createQuestionnaireDetail(questionnaireData: any) {
    const { data, error } = await supabase
      .from('questionnaire details')
      .insert(questionnaireData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateQuestionnaireDetail(id: string, updates: any) {
    const { data, error } = await supabase
      .from('questionnaire details')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteQuestionnaireDetail(id: string) {
    const { error } = await supabase
      .from('questionnaire details')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // User Dashboard
  async getUserDashboards() {
    try {
      const { data, error } = await supabase
        .from('user dashboard')
        .select('*')
        .order('last_activity', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user dashboards:', error)
      return []
    }
  },

  async getUserDashboard(id: string) {
    try {
      const { data, error } = await supabase
        .from('user dashboard')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user dashboard:', error)
      return null
    }
  },

  async getUserDashboardByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user dashboard')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      return data
    } catch (error) {
      console.error('Error fetching user dashboard by user ID:', error)
      return null
    }
  },

  async createUserDashboard(dashboardData: any) {
    try {
      const { data, error } = await supabase
        .from('user dashboard')
        .insert(dashboardData)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating user dashboard:', error)
      return null
    }
  },

  async updateUserDashboard(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('user dashboard')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user dashboard:', error)
      return null
    }
  },

  async updateUserDashboardByUserId(userId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('user dashboard')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user dashboard by user ID:', error)
      return null
    }
  },

  async deleteUserDashboard(id: string) {
    try {
      const { error } = await supabase
        .from('user dashboard')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting user dashboard:', error)
      return false
    }
  },

  // Legacy Questionnaire (keeping for compatibility)
  async saveQuestionnaire(userId: string, questionnaireData: any) {
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .upsert({
        ...questionnaireData,
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getQuestionnaire(userId: string) {
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Risk Management Plans
  async saveRiskPlan(userId: string, riskPlanData: Database['public']['Tables']['risk_management_plans']['Insert']) {
    const { data, error } = await supabase
      .from('risk_management_plans')
      .upsert({
        ...riskPlanData,
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getRiskPlan(userId: string) {
    const { data, error } = await supabase
      .from('risk_management_plans')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  }
}
