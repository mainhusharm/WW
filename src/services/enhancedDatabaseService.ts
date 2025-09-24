import { Pool, PoolClient } from 'pg';

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Enhanced interfaces for comprehensive data tracking
export interface EnhancedUser {
  id?: number;
  uuid?: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  company?: string;
  country?: string;
  agree_to_terms?: boolean;
  agree_to_marketing?: boolean;
  privacy_policy_accepted?: boolean;
  is_verified?: boolean;
  status?: string;
  membership_tier?: string;
  plan_type?: string;
  registration_method?: string;
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date;
}

export interface PaymentDetails {
  id?: string;
  user_id: number;
  user_uuid: string;
  user_email: string;
  user_name: string;
  plan_type: string;
  plan_name: string;
  original_price: number;
  final_price: number;
  currency?: string;
  payment_method: string;
  payment_status?: string;
  coupon_code?: string;
  coupon_applied?: boolean;
  transaction_id?: string;
  transaction_hash?: string;
  crypto_currency?: string;
  crypto_address?: string;
  crypto_verification_status?: string;
  billing_country?: string;
  payment_data?: any;
  created_at?: Date;
}

export interface QuestionnaireDetails {
  id?: string;
  user_id: number;
  user_uuid: string;
  user_email: string;
  user_name: string;
  trades_per_day: string;
  trading_session: string;
  crypto_assets?: string[];
  forex_assets?: string[];
  custom_forex_pairs?: string[];
  has_account: string;
  account_equity?: number;
  prop_firm?: string;
  account_type?: string;
  account_size?: number;
  account_number?: string;
  risk_percentage: number;
  risk_reward_ratio: string;
  trading_experience?: string;
  trading_goals?: string;
  additional_notes?: string;
  is_completed?: boolean;
  created_at?: Date;
}

export interface UserDashboardData {
  id?: string;
  user_id: number;
  user_uuid: string;
  questionnaire_id?: string;
  prop_firm?: string;
  account_type?: string;
  account_size?: number;
  current_equity?: number;
  total_pnl?: number;
  total_trades?: number;
  winning_trades?: number;
  losing_trades?: number;
  win_rate?: number;
  signals_taken?: any[];
  signals_won?: number;
  signals_lost?: number;
  signals_win_rate?: number;
  m1_signals_taken?: number;
  m1_signals_won?: number;
  m1_signals_lost?: number;
  m2_signals_taken?: number;
  m2_signals_won?: number;
  m2_signals_lost?: number;
  m3_signals_taken?: number;
  m3_signals_won?: number;
  m3_signals_lost?: number;
  m4_signals_taken?: number;
  m4_signals_won?: number;
  m4_signals_lost?: number;
  milestone_access_level?: number;
  created_at?: Date;
  updated_at?: Date;
}

class EnhancedDatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(dbConfig);
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  // ENHANCED USER MANAGEMENT
  async createEnhancedUser(userData: EnhancedUser): Promise<EnhancedUser> {
    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, full_name, phone, company, country,
        agree_to_terms, agree_to_marketing, privacy_policy_accepted, registration_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      userData.email,
      userData.password_hash,
      userData.first_name || null,
      userData.last_name || null,
      userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null,
      userData.phone || null,
      userData.company || null,
      userData.country || null,
      userData.agree_to_terms || false,
      userData.agree_to_marketing || false,
      userData.privacy_policy_accepted || false,
      userData.registration_method || 'web'
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getEnhancedUserByEmail(email: string): Promise<EnhancedUser | null> {
    const query = 'SELECT * FROM users WHERE email = $1 AND status = $2';
    const result = await this.query(query, [email, 'active']);
    return result.rows[0] || null;
  }

  // PAYMENT DETAILS MANAGEMENT
  async createPaymentDetails(paymentData: PaymentDetails): Promise<PaymentDetails> {
    const query = `
      INSERT INTO payment_details (
        user_id, user_uuid, user_email, user_name, plan_type, plan_name,
        original_price, final_price, currency, payment_method, payment_status,
        coupon_code, coupon_applied, transaction_id, transaction_hash,
        crypto_currency, crypto_address, crypto_verification_status,
        billing_country, payment_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const values = [
      paymentData.user_id,
      paymentData.user_uuid,
      paymentData.user_email,
      paymentData.user_name,
      paymentData.plan_type,
      paymentData.plan_name,
      paymentData.original_price,
      paymentData.final_price,
      paymentData.currency || 'USD',
      paymentData.payment_method,
      paymentData.payment_status || 'pending',
      paymentData.coupon_code || null,
      paymentData.coupon_applied || false,
      paymentData.transaction_id || null,
      paymentData.transaction_hash || null,
      paymentData.crypto_currency || null,
      paymentData.crypto_address || null,
      paymentData.crypto_verification_status || 'pending',
      paymentData.billing_country || null,
      paymentData.payment_data ? JSON.stringify(paymentData.payment_data) : null
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getPaymentDetailsByUserId(userId: number): Promise<PaymentDetails[]> {
    const query = 'SELECT * FROM payment_details WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.query(query, [userId]);
    return result.rows;
  }

  // QUESTIONNAIRE MANAGEMENT
  async saveQuestionnaireDetails(questionnaireData: QuestionnaireDetails): Promise<QuestionnaireDetails> {
    const query = `
      INSERT INTO questionnaire_details (
        user_id, user_uuid, user_email, user_name, trades_per_day, trading_session,
        crypto_assets, forex_assets, custom_forex_pairs, has_account, account_equity,
        prop_firm, account_type, account_size, account_number, risk_percentage,
        risk_reward_ratio, trading_experience, trading_goals, additional_notes, is_completed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (user_id) DO UPDATE SET
        trades_per_day = EXCLUDED.trades_per_day,
        trading_session = EXCLUDED.trading_session,
        crypto_assets = EXCLUDED.crypto_assets,
        forex_assets = EXCLUDED.forex_assets,
        custom_forex_pairs = EXCLUDED.custom_forex_pairs,
        has_account = EXCLUDED.has_account,
        account_equity = EXCLUDED.account_equity,
        prop_firm = EXCLUDED.prop_firm,
        account_type = EXCLUDED.account_type,
        account_size = EXCLUDED.account_size,
        account_number = EXCLUDED.account_number,
        risk_percentage = EXCLUDED.risk_percentage,
        risk_reward_ratio = EXCLUDED.risk_reward_ratio,
        trading_experience = EXCLUDED.trading_experience,
        trading_goals = EXCLUDED.trading_goals,
        additional_notes = EXCLUDED.additional_notes,
        is_completed = EXCLUDED.is_completed,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      questionnaireData.user_id,
      questionnaireData.user_uuid,
      questionnaireData.user_email,
      questionnaireData.user_name,
      questionnaireData.trades_per_day,
      questionnaireData.trading_session,
      questionnaireData.crypto_assets || [],
      questionnaireData.forex_assets || [],
      questionnaireData.custom_forex_pairs || [],
      questionnaireData.has_account,
      questionnaireData.account_equity || null,
      questionnaireData.prop_firm || null,
      questionnaireData.account_type || null,
      questionnaireData.account_size || null,
      questionnaireData.account_number || null,
      questionnaireData.risk_percentage,
      questionnaireData.risk_reward_ratio,
      questionnaireData.trading_experience || null,
      questionnaireData.trading_goals || null,
      questionnaireData.additional_notes || null,
      questionnaireData.is_completed || false
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  // DASHBOARD DATA MANAGEMENT
  async saveUserDashboardData(dashboardData: UserDashboardData): Promise<UserDashboardData> {
    const query = `
      INSERT INTO user_dashboard_data (
        user_id, user_uuid, questionnaire_id, prop_firm, account_type, account_size,
        current_equity, total_pnl, total_trades, winning_trades, losing_trades, win_rate,
        signals_taken, signals_won, signals_lost, signals_win_rate,
        m1_signals_taken, m1_signals_won, m1_signals_lost,
        m2_signals_taken, m2_signals_won, m2_signals_lost,
        m3_signals_taken, m3_signals_won, m3_signals_lost,
        m4_signals_taken, m4_signals_won, m4_signals_lost,
        milestone_access_level
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      ON CONFLICT (user_id) DO UPDATE SET
        questionnaire_id = EXCLUDED.questionnaire_id,
        prop_firm = EXCLUDED.prop_firm,
        account_type = EXCLUDED.account_type,
        account_size = EXCLUDED.account_size,
        current_equity = EXCLUDED.current_equity,
        total_pnl = EXCLUDED.total_pnl,
        total_trades = EXCLUDED.total_trades,
        winning_trades = EXCLUDED.winning_trades,
        losing_trades = EXCLUDED.losing_trades,
        win_rate = EXCLUDED.win_rate,
        signals_taken = EXCLUDED.signals_taken,
        signals_won = EXCLUDED.signals_won,
        signals_lost = EXCLUDED.signals_lost,
        signals_win_rate = EXCLUDED.signals_win_rate,
        m1_signals_taken = EXCLUDED.m1_signals_taken,
        m1_signals_won = EXCLUDED.m1_signals_won,
        m1_signals_lost = EXCLUDED.m1_signals_lost,
        m2_signals_taken = EXCLUDED.m2_signals_taken,
        m2_signals_won = EXCLUDED.m2_signals_won,
        m2_signals_lost = EXCLUDED.m2_signals_lost,
        m3_signals_taken = EXCLUDED.m3_signals_taken,
        m3_signals_won = EXCLUDED.m3_signals_won,
        m3_signals_lost = EXCLUDED.m3_signals_lost,
        m4_signals_taken = EXCLUDED.m4_signals_taken,
        m4_signals_won = EXCLUDED.m4_signals_won,
        m4_signals_lost = EXCLUDED.m4_signals_lost,
        milestone_access_level = EXCLUDED.milestone_access_level,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      dashboardData.user_id,
      dashboardData.user_uuid,
      dashboardData.questionnaire_id || null,
      dashboardData.prop_firm || null,
      dashboardData.account_type || null,
      dashboardData.account_size || null,
      dashboardData.current_equity || 0,
      dashboardData.total_pnl || 0,
      dashboardData.total_trades || 0,
      dashboardData.winning_trades || 0,
      dashboardData.losing_trades || 0,
      dashboardData.win_rate || 0,
      dashboardData.signals_taken ? JSON.stringify(dashboardData.signals_taken) : '[]',
      dashboardData.signals_won || 0,
      dashboardData.signals_lost || 0,
      dashboardData.signals_win_rate || 0,
      dashboardData.m1_signals_taken || 0,
      dashboardData.m1_signals_won || 0,
      dashboardData.m1_signals_lost || 0,
      dashboardData.m2_signals_taken || 0,
      dashboardData.m2_signals_won || 0,
      dashboardData.m2_signals_lost || 0,
      dashboardData.m3_signals_taken || 0,
      dashboardData.m3_signals_won || 0,
      dashboardData.m3_signals_lost || 0,
      dashboardData.m4_signals_taken || 0,
      dashboardData.m4_signals_won || 0,
      dashboardData.m4_signals_lost || 0,
      dashboardData.milestone_access_level || 1
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  // SIGNAL TRACKING
  async trackSignal(signalData: any): Promise<any> {
    const query = `
      INSERT INTO signal_tracking (
        user_id, user_uuid, signal_id, signal_type, symbol, direction,
        entry_price, stop_loss, take_profit, signal_time, status, pnl
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      signalData.user_id,
      signalData.user_uuid,
      signalData.signal_id,
      signalData.signal_type,
      signalData.symbol,
      signalData.direction,
      signalData.entry_price || null,
      signalData.stop_loss || null,
      signalData.take_profit || null,
      signalData.signal_time,
      signalData.status || 'pending',
      signalData.pnl || 0
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  // UTILITY METHODS
  async getUserCompleteProfile(userId: number): Promise<any> {
    const query = 'SELECT * FROM user_complete_profile WHERE id = $1';
    const result = await this.query(query, [userId]);
    return result.rows[0] || null;
  }

  async getDashboardOverview(userId: number): Promise<any> {
    const query = 'SELECT * FROM dashboard_overview WHERE user_id = $1';
    const result = await this.query(query, [userId]);
    return result.rows[0] || null;
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('Enhanced database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Enhanced database connection failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const enhancedDatabaseService = new EnhancedDatabaseService();
export default enhancedDatabaseService;
