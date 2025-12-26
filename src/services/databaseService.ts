import { Pool, PoolClient } from 'pg';

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
  ssl: {
    rejectUnauthorized: false // Required for Render.com hosted PostgreSQL
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Interfaces
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  status: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  payment_method?: string;
  payment_id?: string;
  status: string;
  starts_at: Date;
  expires_at?: Date;
  created_at: Date;
}

export interface UserQuestionnaire {
  id: string;
  user_id: string;
  account_equity: number;
  prop_firm_name?: string;
  account_type: string;
  account_number?: string;
  trading_experience?: string;
  risk_tolerance?: string;
  preferred_instruments?: string[];
  trading_goals?: string;
  daily_risk_limit?: number;
  max_drawdown_percent?: number;
  preferred_session?: string;
  additional_notes?: string;
  completed_at: Date;
  updated_at: Date;
}

export interface UserDashboardSettings {
  id: string;
  user_id: string;
  current_equity?: number;
  display_currency: string;
  timezone: string;
  theme: string;
  milestone_access_level: number;
  preferred_view_mode: string;
  created_at: Date;
  updated_at: Date;
}

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(dbConfig);
    
    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute a query with automatic client management
   */
  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  // USER MANAGEMENT
  
  /**
   * Create a new user (signup)
   */
  async createUser(userData: {
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    country?: string;
  }): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, country)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      userData.email,
      userData.password_hash,
      userData.first_name || null,
      userData.last_name || null,
      userData.phone || null,
      userData.country || null
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1 AND status = $2';
    const result = await this.query(query, [email, 'active']);
    return result.rows[0] || null;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1 AND status = $2';
    const result = await this.query(query, [userId, 'active']);
    return result.rows[0] || null;
  }

  /**
   * Update user last login
   */
  async updateUserLastLogin(userId: string): Promise<void> {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await this.query(query, [userId]);
  }

  // SUBSCRIPTION MANAGEMENT

  /**
   * Create user subscription (payment)
   */
  async createSubscription(subscriptionData: {
    user_id: string;
    plan_type: string;
    plan_name: string;
    amount: number;
    currency?: string;
    billing_cycle: string;
    payment_method?: string;
    payment_id?: string;
    starts_at: Date;
    expires_at?: Date;
  }): Promise<UserSubscription> {
    const query = `
      INSERT INTO user_subscriptions 
      (user_id, plan_type, plan_name, amount, currency, billing_cycle, payment_method, payment_id, starts_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      subscriptionData.user_id,
      subscriptionData.plan_type,
      subscriptionData.plan_name,
      subscriptionData.amount,
      subscriptionData.currency || 'USD',
      subscriptionData.billing_cycle,
      subscriptionData.payment_method || null,
      subscriptionData.payment_id || null,
      subscriptionData.starts_at,
      subscriptionData.expires_at || null
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get active subscription for user
   */
  async getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
    const query = `
      SELECT * FROM user_subscriptions 
      WHERE user_id = $1 AND status = $2 
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await this.query(query, [userId, 'active']);
    return result.rows[0] || null;
  }

  // QUESTIONNAIRE MANAGEMENT

  /**
   * Save questionnaire responses
   */
  async saveQuestionnaire(questionnaireData: {
    user_id: string;
    account_equity: number;
    prop_firm_name?: string;
    account_type: string;
    account_number?: string;
    trading_experience?: string;
    risk_tolerance?: string;
    preferred_instruments?: string[];
    trading_goals?: string;
    daily_risk_limit?: number;
    max_drawdown_percent?: number;
    preferred_session?: string;
    additional_notes?: string;
  }): Promise<UserQuestionnaire> {
    const query = `
      INSERT INTO user_questionnaire 
      (user_id, account_equity, prop_firm_name, account_type, account_number, 
       trading_experience, risk_tolerance, preferred_instruments, trading_goals,
       daily_risk_limit, max_drawdown_percent, preferred_session, additional_notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (user_id) DO UPDATE SET
        account_equity = EXCLUDED.account_equity,
        prop_firm_name = EXCLUDED.prop_firm_name,
        account_type = EXCLUDED.account_type,
        account_number = EXCLUDED.account_number,
        trading_experience = EXCLUDED.trading_experience,
        risk_tolerance = EXCLUDED.risk_tolerance,
        preferred_instruments = EXCLUDED.preferred_instruments,
        trading_goals = EXCLUDED.trading_goals,
        daily_risk_limit = EXCLUDED.daily_risk_limit,
        max_drawdown_percent = EXCLUDED.max_drawdown_percent,
        preferred_session = EXCLUDED.preferred_session,
        additional_notes = EXCLUDED.additional_notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      questionnaireData.user_id,
      questionnaireData.account_equity,
      questionnaireData.prop_firm_name || null,
      questionnaireData.account_type,
      questionnaireData.account_number || null,
      questionnaireData.trading_experience || null,
      questionnaireData.risk_tolerance || null,
      questionnaireData.preferred_instruments || null,
      questionnaireData.trading_goals || null,
      questionnaireData.daily_risk_limit || null,
      questionnaireData.max_drawdown_percent || null,
      questionnaireData.preferred_session || null,
      questionnaireData.additional_notes || null
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get user questionnaire
   */
  async getUserQuestionnaire(userId: string): Promise<UserQuestionnaire | null> {
    const query = 'SELECT * FROM user_questionnaire WHERE user_id = $1';
    const result = await this.query(query, [userId]);
    return result.rows[0] || null;
  }

  // DASHBOARD SETTINGS

  /**
   * Get user dashboard settings
   */
  async getUserDashboardSettings(userId: string): Promise<UserDashboardSettings | null> {
    const query = 'SELECT * FROM user_dashboard_settings WHERE user_id = $1';
    const result = await this.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update dashboard settings
   */
  async updateDashboardSettings(userId: string, settings: Partial<UserDashboardSettings>): Promise<UserDashboardSettings> {
    const setClause = Object.keys(settings)
      .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [userId, ...Object.values(settings).filter((_, index) => {
      const key = Object.keys(settings)[index];
      return key !== 'id' && key !== 'user_id' && key !== 'created_at';
    })];

    const query = `
      UPDATE user_dashboard_settings 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  // UTILITY METHODS

  /**
   * Get complete user profile with all related data
   */
  async getUserProfile(userId: string): Promise<{
    user: User;
    subscription: UserSubscription | null;
    questionnaire: UserQuestionnaire | null;
    dashboardSettings: UserDashboardSettings | null;
  } | null> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    const [subscription, questionnaire, dashboardSettings] = await Promise.all([
      this.getUserActiveSubscription(userId),
      this.getUserQuestionnaire(userId),
      this.getUserDashboardSettings(userId)
    ]);

    return {
      user,
      subscription,
      questionnaire,
      dashboardSettings
    };
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('Database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Close the database pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
