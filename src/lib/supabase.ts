import { createClient } from '@supabase/supabase-js'

// Direct initialization with error handling for missing APIs
let _supabase: ReturnType<typeof createClient> | null = null
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

const createSupabaseClient = () => {
  if (_supabase) return _supabase

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    }

    console.log('🔄 Creating Supabase client...')
    console.log('Request API available:', typeof globalThis.Request)
    console.log('Response API available:', typeof globalThis.Response)
    console.log('Headers API available:', typeof globalThis.Headers)
    console.log('fetch API available:', typeof globalThis.fetch)

    // Check if Web APIs are available before creating client
    if (typeof globalThis.Request === 'undefined' ||
        typeof globalThis.Response === 'undefined' ||
        typeof globalThis.Headers === 'undefined') {
      console.error('❌ Web APIs not available, cannot create Supabase client');
      throw new Error('Web APIs not available');
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client created successfully')
    return _supabase
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw error as Error
  }
}

const createSupabaseAdminClient = () => {
  if (_supabaseAdmin) return _supabaseAdmin

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }

    if (!serviceRoleKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    }

    _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    return _supabaseAdmin
  } catch (error) {
    console.error('❌ Failed to create Supabase admin client:', error)
    throw error
  }
}

// Create clients immediately but with error handling
try {
  _supabase = createSupabaseClient()
} catch (error) {
  console.warn('Initial Supabase client creation failed, will retry later:', error.message)
}

try {
  _supabaseAdmin = createSupabaseAdminClient()
} catch (error) {
  console.warn('Initial Supabase admin client creation failed, will retry later:', error.message)
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabase) {
      try {
        _supabase = createSupabaseClient()
      } catch (error) {
        console.error('Failed to create Supabase client in proxy:', error)
        throw error
      }
    }
    return _supabase[prop as keyof typeof _supabase]
  }
})

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      try {
        _supabaseAdmin = createSupabaseAdminClient()
      } catch (error) {
        console.error('Failed to create Supabase admin client in proxy:', error)
        throw error
      }
    }
    return _supabaseAdmin[prop as keyof typeof _supabaseAdmin]
  }
})

// Database types
export interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  company?: string
  country: string
  language: string
  bio?: string
  unique_id: string
  membership_tier: string
  setup_complete: boolean
  created_at: string
  updated_at: string
}

export interface QuestionnaireData {
  id: string
  user_id: string
  // Account Information
  has_account: boolean
  account_equity?: number
  account_size?: number
  prop_firm: string
  account_type: string
  account_number?: string
  account_currency: string

  // Trading Experience
  trading_experience: string
  risk_tolerance: string
  trading_goals: string
  preferred_markets: string[]
  trading_style: string
  trades_per_day: string
  trading_session: string

  // Risk Management
  risk_percentage: number
  risk_reward_ratio: number

  // Assets
  forex_assets: string[]
  crypto_assets: string[]
  stocks_assets: string[]

  // Compliance
  max_daily_loss: number
  max_total_loss: number
  profit_target: number

  // Timestamps
  created_at: string
  updated_at: string
}

export interface PaymentRecord {
  id: string
  user_id: string
  plan_name: string
  plan_id: string
  amount: number
  discount_amount: number
  final_amount: number
  coupon_code?: string
  payment_method: string
  payment_status: string
  transaction_id?: string
  payment_processor?: string
  currency: string
  payment_date: string
  created_at: string
}

export interface TradeRecord {
  id: string
  user_id: string
  symbol: string
  direction: 'BUY' | 'SELL'
  entry_price: number
  exit_price?: number
  quantity: number
  pnl?: number
  entry_time: string
  exit_time?: string
  stop_loss?: number
  take_profit?: number
  outcome?: 'Target Hit' | 'Stop Loss Hit' | 'Breakeven' | 'Open'
  notes?: string
  signal_id?: string
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  date: string
  symbol: string
  direction: 'BUY' | 'SELL'
  entry_price: number
  exit_price?: number
  quantity: number
  pnl?: number
  notes: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface AIChatMessage {
  id: string
  user_id: string
  session_id: string
  message: string
  response: string
  message_type: 'user' | 'assistant'
  context?: any
  created_at: string
}

export interface RiskProtocolData {
  id: string
  user_id: string
  account_balance: number
  risk_per_trade: number
  max_daily_loss: number
  max_drawdown: number
  stop_loss_default: number
  take_profit_default: number
  risk_reward_ratio: number
  created_at: string
  updated_at: string
}

export interface PerformanceMetrics {
  id: string
  user_id: string
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
  created_at: string
  updated_at: string
}

export interface NotificationRecord {
  id: string
  user_id: string
  type: 'signal' | 'news' | 'trade' | 'system'
  title: string
  message: string
  read: boolean
  data?: any
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  // Risk Management
  risk_per_trade: number
  max_daily_risk: number
  max_drawdown: number
  stop_loss_default: number
  take_profit_default: number
  risk_reward_ratio: number

  // Trading Preferences
  trading: {
    default_lot_size: number
    max_positions: number
    auto_close_on_profit: boolean
    auto_close_on_loss: boolean
    slippage: number
    execution_mode: string
    confirm_trades: boolean
    one_click_trading: boolean
  }

  // Display & Theme
  display: {
    theme: string
    accent_color: string
    font_size: string
    compact_mode: boolean
    show_animations: boolean
    chart_style: string
    default_timeframe: string
  }

  // Notifications
  notifications: {
    signals: boolean
    news: boolean
    trades: boolean
    price_alerts: boolean
    email: boolean
    push: boolean
    sound: boolean
    desktop: boolean
  }

  // Security
  security: {
    two_factor_auth: boolean
    session_timeout: number
    login_notifications: boolean
    device_tracking: boolean
    auto_logout: boolean
  }

  // General
  currency: string
  timezone: string
  auto_save: boolean

  created_at: string
  updated_at: string
}
