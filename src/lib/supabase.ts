import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bgejxnkyzjamroeikfkr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

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
      },
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
    const { data, error } = await supabase
      .from('user dashboard')
      .select('*')
      .order('last_activity', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getUserDashboard(id: string) {
    const { data, error } = await supabase
      .from('user dashboard')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getUserDashboardByUserId(userId: string) {
    const { data, error } = await supabase
      .from('user dashboard')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async createUserDashboard(dashboardData: any) {
    const { data, error } = await supabase
      .from('user dashboard')
      .insert(dashboardData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateUserDashboard(id: string, updates: any) {
    const { data, error } = await supabase
      .from('user dashboard')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateUserDashboardByUserId(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user dashboard')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteUserDashboard(id: string) {
    const { error } = await supabase
      .from('user dashboard')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
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
