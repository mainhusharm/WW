import { supabase } from '../lib/supabase';
import {
  UserProfile,
  QuestionnaireData,
  PaymentRecord,
  TradeRecord,
  JournalEntry,
  AIChatMessage,
  RiskProtocolData,
  PerformanceMetrics,
  NotificationRecord,
  UserSettings
} from '../lib/supabase';

export class SupabaseService {
  private static instance: SupabaseService;

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // ===========================================
  // USER PROFILES
  // ===========================================

  async createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ===========================================
  // QUESTIONNAIRE DATA
  // ===========================================

  async saveQuestionnaireData(data: Omit<QuestionnaireData, 'id' | 'created_at' | 'updated_at'>): Promise<QuestionnaireData> {
    const { data: result, error } = await supabase
      .from('questionnaire_data')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getQuestionnaireData(userId: string): Promise<QuestionnaireData | null> {
    const { data, error } = await supabase
      .from('questionnaire_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ===========================================
  // PAYMENT RECORDS
  // ===========================================

  async createPaymentRecord(record: Omit<PaymentRecord, 'id' | 'created_at'>): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from('payment_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPaymentRecords(userId: string): Promise<PaymentRecord[]> {
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPaymentRecordByTransactionId(transactionId: string): Promise<PaymentRecord | null> {
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ===========================================
  // TRADE RECORDS
  // ===========================================

  async createTradeRecord(record: Omit<TradeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TradeRecord> {
    const { data, error } = await supabase
      .from('trade_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTradeRecord(tradeId: string, updates: Partial<TradeRecord>): Promise<TradeRecord> {
    const { data, error } = await supabase
      .from('trade_records')
      .update(updates)
      .eq('id', tradeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTradeRecords(userId: string, limit?: number): Promise<TradeRecord[]> {
    let query = supabase
      .from('trade_records')
      .select('*')
      .eq('user_id', userId)
      .order('entry_time', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getOpenTrades(userId: string): Promise<TradeRecord[]> {
    const { data, error } = await supabase
      .from('trade_records')
      .select('*')
      .eq('user_id', userId)
      .is('exit_time', null)
      .order('entry_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===========================================
  // JOURNAL ENTRIES
  // ===========================================

  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateJournalEntry(entryId: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteJournalEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  }

  async getJournalEntries(userId: string, limit?: number): Promise<JournalEntry[]> {
    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ===========================================
  // AI CHAT MESSAGES
  // ===========================================

  async saveChatMessage(message: Omit<AIChatMessage, 'id' | 'created_at'>): Promise<AIChatMessage> {
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getChatMessages(userId: string, sessionId?: string, limit = 50): Promise<AIChatMessage[]> {
    let query = supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ===========================================
  // RISK PROTOCOL DATA
  // ===========================================

  async saveRiskProtocolData(data: Omit<RiskProtocolData, 'id' | 'created_at' | 'updated_at'>): Promise<RiskProtocolData> {
    const { data: result, error } = await supabase
      .from('risk_protocol_data')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getRiskProtocolData(userId: string): Promise<RiskProtocolData | null> {
    const { data, error } = await supabase
      .from('risk_protocol_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ===========================================
  // PERFORMANCE METRICS
  // ===========================================

  async savePerformanceMetrics(metrics: Omit<PerformanceMetrics, 'id' | 'created_at' | 'updated_at'>): Promise<PerformanceMetrics> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .upsert(metrics, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPerformanceMetrics(userId: string): Promise<PerformanceMetrics | null> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ===========================================
  // NOTIFICATIONS
  // ===========================================

  async createNotification(notification: Omit<NotificationRecord, 'id' | 'created_at'>): Promise<NotificationRecord> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getNotifications(userId: string, unreadOnly = false): Promise<NotificationRecord[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  // ===========================================
  // USER SETTINGS
  // ===========================================

  async saveUserSettings(settings: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(settings, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===========================================
  // SUBSCRIPTION MANAGEMENT
  // ===========================================

  async createSubscription(userId: string, planId: string): Promise<any> {
    // Import the subscription service
    const { SubscriptionService } = await import('../services/subscriptionService');
    const subscriptionService = SubscriptionService.getInstance();
    return subscriptionService.createSubscription(userId, planId);
  }

  async getUserSubscription(userId: string): Promise<any> {
    const { SubscriptionService } = await import('../services/subscriptionService');
    const subscriptionService = SubscriptionService.getInstance();
    return subscriptionService.getSubscription(userId);
  }

  async checkUserAccess(userId: string): Promise<any> {
    const { SubscriptionService } = await import('../services/subscriptionService');
    const subscriptionService = SubscriptionService.getInstance();
    return subscriptionService.checkAccess(userId);
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  async getUserStats(userId: string): Promise<{
    totalTrades: number;
    totalPnl: number;
    winRate: number;
    totalPayments: number;
    totalJournalEntries: number;
    accountBalance: number;
  }> {
    // Get trade stats
    const { data: trades, error: tradesError } = await supabase
      .from('trade_records')
      .select('pnl')
      .eq('user_id', userId);

    if (tradesError) throw tradesError;

    const totalTrades = trades?.length || 0;
    const winningTrades = trades?.filter(t => (t.pnl || 0) > 0).length || 0;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalPnl = trades?.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0;

    // Get payment count
    const { count: totalPayments, error: paymentsError } = await supabase
      .from('payment_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (paymentsError) throw paymentsError;

    // Get journal entries count
    const { count: totalJournalEntries, error: journalError } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (journalError) throw journalError;

    // Get account balance from performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('total_pnl')
      .eq('user_id', userId)
      .single();

    // Get initial balance from questionnaire
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('questionnaire_data')
      .select('account_size, account_equity, has_account')
      .eq('user_id', userId)
      .single();

    let accountBalance = 10000; // Default
    if (!questionnaireError && questionnaire) {
      const initialBalance = questionnaire.has_account
        ? questionnaire.account_equity
        : questionnaire.account_size;
      accountBalance = (initialBalance || 10000) + (metrics?.total_pnl || 0);
    }

    return {
      totalTrades,
      totalPnl,
      winRate,
      totalPayments: totalPayments || 0,
      totalJournalEntries: totalJournalEntries || 0,
      accountBalance
    };
  }
}

export const supabaseService = SupabaseService.getInstance();
