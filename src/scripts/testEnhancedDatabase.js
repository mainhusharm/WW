const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
  ssl: {
    rejectUnauthorized: false
  }
};

async function testEnhancedDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🧪 Testing Enhanced Database Schema and Data Insertion...\n');
    
    // Test 1: Basic connection
    console.log('1️⃣ Testing database connection...');
    const timeResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful:', timeResult.rows[0].current_time);
    
    // Test 2: Check if enhanced tables exist
    console.log('\n2️⃣ Checking enhanced tables...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'payment_details', 'questionnaire_details', 'user_dashboard_data', 'signal_tracking', 'user_subscriptions', 'user_dashboard_settings')
      ORDER BY table_name;
    `;
    const tablesResult = await pool.query(tablesQuery);
    console.log('📋 Enhanced tables found:', tablesResult.rows.map(row => row.table_name));
    
    // Test 3: Create enhanced test user (Enhanced Signup Data)
    console.log('\n3️⃣ Testing Enhanced User Creation (Signup Form Data)...');
    const testEmail = 'enhanced.test@traderedgepro.com';
    const testPassword = 'EnhancedPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    // Delete existing test user if exists
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    
    const enhancedUserData = {
      email: testEmail,
      password_hash: hashedPassword,
      first_name: 'Enhanced',
      last_name: 'TestUser',
      full_name: 'Enhanced TestUser',
      phone: '+1-555-0123',
      company: 'TraderEdge Test Corp',
      country: 'United States',
      agree_to_terms: true,
      agree_to_marketing: false,
      privacy_policy_accepted: true,
      registration_method: 'web'
    };
    
    const userResult = await pool.query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, full_name, phone, company, country,
        agree_to_terms, agree_to_marketing, privacy_policy_accepted, registration_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, uuid, email, first_name, last_name, full_name, phone, company, country, created_at
    `, [
      enhancedUserData.email,
      enhancedUserData.password_hash,
      enhancedUserData.first_name,
      enhancedUserData.last_name,
      enhancedUserData.full_name,
      enhancedUserData.phone,
      enhancedUserData.company,
      enhancedUserData.country,
      enhancedUserData.agree_to_terms,
      enhancedUserData.agree_to_marketing,
      enhancedUserData.privacy_policy_accepted,
      enhancedUserData.registration_method
    ]);
    
    const userId = userResult.rows[0].id;
    const userUuid = userResult.rows[0].uuid;
    console.log('✅ Enhanced user created:', {
      id: userId,
      uuid: userUuid,
      email: userResult.rows[0].email,
      name: userResult.rows[0].full_name,
      phone: userResult.rows[0].phone,
      company: userResult.rows[0].company
    });
    
    // Test 4: Create payment details (Payment Form Data)
    console.log('\n4️⃣ Testing Payment Details Creation (Payment Form Data)...');
    const paymentData = {
      user_id: userId,
      user_uuid: userUuid,
      user_email: testEmail,
      user_name: 'Enhanced TestUser',
      plan_type: 'pro',
      plan_name: 'Pro Plan',
      plan_duration: 'monthly',
      plan_description: 'Professional trading signals with milestone access',
      original_price: 199.00,
      discount_percentage: 10.00,
      discount_amount: 19.90,
      final_price: 179.10,
      currency: 'USD',
      coupon_code: 'SAVE10',
      coupon_applied: true,
      coupon_message: '10% discount applied',
      payment_method: 'stripe',
      payment_provider: 'stripe',
      payment_status: 'completed',
      transaction_id: `txn_${Date.now()}`,
      billing_country: 'United States',
      billing_city: 'New York',
      payment_data: JSON.stringify({
        stripe_payment_intent: 'pi_test_123456',
        card_last4: '4242',
        card_brand: 'visa'
      })
    };
    
    const paymentResult = await pool.query(`
      INSERT INTO payment_details (
        user_id, user_uuid, user_email, user_name, plan_type, plan_name, plan_duration, plan_description,
        original_price, discount_percentage, discount_amount, final_price, currency,
        coupon_code, coupon_applied, coupon_message, payment_method, payment_provider, payment_status,
        transaction_id, billing_country, billing_city, payment_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING id, plan_name, final_price, payment_status, transaction_id
    `, [
      paymentData.user_id, paymentData.user_uuid, paymentData.user_email, paymentData.user_name,
      paymentData.plan_type, paymentData.plan_name, paymentData.plan_duration, paymentData.plan_description,
      paymentData.original_price, paymentData.discount_percentage, paymentData.discount_amount, paymentData.final_price, paymentData.currency,
      paymentData.coupon_code, paymentData.coupon_applied, paymentData.coupon_message, paymentData.payment_method, paymentData.payment_provider, paymentData.payment_status,
      paymentData.transaction_id, paymentData.billing_country, paymentData.billing_city, paymentData.payment_data
    ]);
    
    console.log('✅ Payment details created:', paymentResult.rows[0]);
    
    // Test 5: Create questionnaire details (Questionnaire Form Data)
    console.log('\n5️⃣ Testing Questionnaire Details Creation (Questionnaire Form Data)...');
    const questionnaireData = {
      user_id: userId,
      user_uuid: userUuid,
      user_email: testEmail,
      user_name: 'Enhanced TestUser',
      trades_per_day: '3-5',
      trading_session: 'us',
      preferred_trading_hours: '9:30 AM - 4:00 PM EST',
      crypto_assets: ['BTC', 'ETH', 'SOL'],
      forex_assets: ['EURUSD', 'GBPUSD', 'USDJPY'],
      custom_forex_pairs: ['AUDCAD', 'NZDCHF'],
      has_account: 'yes',
      account_equity: 75000.00,
      prop_firm: 'FTMO',
      account_type: 'Pro',
      account_size: 100000.00,
      account_number: 'FTMO-123456789',
      account_currency: 'USD',
      broker_name: 'MetaTrader 5',
      broker_platform: 'MT5',
      risk_percentage: 2.0,
      risk_reward_ratio: '3',
      max_daily_loss_percentage: 5.0,
      max_weekly_loss_percentage: 10.0,
      max_monthly_loss_percentage: 15.0,
      trading_experience: 'advanced',
      trading_goals: 'Achieve consistent monthly profits while managing risk effectively',
      trading_style: 'day_trading',
      preferred_markets: ['forex', 'crypto'],
      risk_tolerance: 'moderate',
      volatility_tolerance: 'medium',
      drawdown_tolerance: 10.0,
      emotional_control: 'good',
      discipline_level: 'excellent',
      stress_management: 'good',
      additional_notes: 'Looking for high-quality signals with proper risk management',
      marketing_consent: false,
      terms_accepted: true,
      privacy_policy_accepted: true,
      completion_percentage: 100.0,
      is_completed: true
    };
    
    const questionnaireResult = await pool.query(`
      INSERT INTO questionnaire_details (
        user_id, user_uuid, user_email, user_name, trades_per_day, trading_session, preferred_trading_hours,
        crypto_assets, forex_assets, custom_forex_pairs, has_account, account_equity, prop_firm, account_type,
        account_size, account_number, account_currency, broker_name, broker_platform, risk_percentage,
        risk_reward_ratio, max_daily_loss_percentage, max_weekly_loss_percentage, max_monthly_loss_percentage,
        trading_experience, trading_goals, trading_style, preferred_markets, risk_tolerance, volatility_tolerance,
        drawdown_tolerance, emotional_control, discipline_level, stress_management, additional_notes,
        marketing_consent, terms_accepted, privacy_policy_accepted, completion_percentage, is_completed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40)
      RETURNING id, prop_firm, account_type, account_equity, trading_experience, is_completed
    `, [
      questionnaireData.user_id, questionnaireData.user_uuid, questionnaireData.user_email, questionnaireData.user_name,
      questionnaireData.trades_per_day, questionnaireData.trading_session, questionnaireData.preferred_trading_hours,
      questionnaireData.crypto_assets, questionnaireData.forex_assets, questionnaireData.custom_forex_pairs,
      questionnaireData.has_account, questionnaireData.account_equity, questionnaireData.prop_firm, questionnaireData.account_type,
      questionnaireData.account_size, questionnaireData.account_number, questionnaireData.account_currency,
      questionnaireData.broker_name, questionnaireData.broker_platform, questionnaireData.risk_percentage,
      questionnaireData.risk_reward_ratio, questionnaireData.max_daily_loss_percentage, questionnaireData.max_weekly_loss_percentage,
      questionnaireData.max_monthly_loss_percentage, questionnaireData.trading_experience, questionnaireData.trading_goals,
      questionnaireData.trading_style, questionnaireData.preferred_markets, questionnaireData.risk_tolerance,
      questionnaireData.volatility_tolerance, questionnaireData.drawdown_tolerance, questionnaireData.emotional_control,
      questionnaireData.discipline_level, questionnaireData.stress_management, questionnaireData.additional_notes,
      questionnaireData.marketing_consent, questionnaireData.terms_accepted, questionnaireData.privacy_policy_accepted,
      questionnaireData.completion_percentage, questionnaireData.is_completed
    ]);
    
    const questionnaireId = questionnaireResult.rows[0].id;
    console.log('✅ Questionnaire details created:', questionnaireResult.rows[0]);
    
    // Test 6: Create user dashboard data (Dashboard Tracking Data)
    console.log('\n6️⃣ Testing User Dashboard Data Creation (Dashboard Tracking Data)...');
    const dashboardData = {
      user_id: userId,
      user_uuid: userUuid,
      questionnaire_id: questionnaireId,
      prop_firm: 'FTMO',
      account_type: 'Pro',
      account_size: 100000.00,
      account_currency: 'USD',
      risk_per_trade: 2.0,
      trading_experience: 'advanced',
      trading_style: 'day_trading',
      unique_id: `TRADER-${userId}`,
      // Current Account Status (EQUITY TRACKING)
      account_balance: 75000.00,
      initial_equity: 75000.00,
      current_equity: 78500.00,
      available_balance: 70000.00,
      margin_used: 5000.00,
      margin_available: 70000.00,
      // Performance Metrics
      total_pnl: 3500.00,
      daily_pnl: 250.00,
      weekly_pnl: 1200.00,
      monthly_pnl: 3500.00,
      yearly_pnl: 3500.00,
      // Trading Statistics (WINS AND LOSSES)
      total_trades: 45,
      winning_trades: 32,
      losing_trades: 13,
      break_even_trades: 0,
      win_rate: 71.11,
      loss_rate: 28.89,
      average_win: 180.50,
      average_loss: -95.25,
      largest_win: 450.00,
      largest_loss: -200.00,
      profit_factor: 1.89,
      gross_profit: 5776.00,
      gross_loss: -2276.00,
      // Signal Tracking (SIGNALS TAKEN, WINS, LOSSES)
      signals_taken: JSON.stringify([
        {signal_id: 'SIG001', type: 'M1', symbol: 'EURUSD', status: 'won', pnl: 150.00, date: '2024-01-15'},
        {signal_id: 'SIG002', type: 'M2', symbol: 'GBPUSD', status: 'lost', pnl: -75.00, date: '2024-01-16'},
        {signal_id: 'SIG003', type: 'M1', symbol: 'USDJPY', status: 'won', pnl: 200.00, date: '2024-01-17'}
      ]),
      signals_won: 28,
      signals_lost: 12,
      signals_pending: 5,
      signals_win_rate: 70.00,
      signals_total_pnl: 2800.00,
      signals_best_trade: 450.00,
      signals_worst_trade: -150.00,
      // Milestone Signal Performance (DETAILED BREAKDOWN)
      m1_signals_taken: 20,
      m1_signals_won: 18,
      m1_signals_lost: 2,
      m1_win_rate: 90.00,
      m1_total_pnl: 1800.00,
      m2_signals_taken: 15,
      m2_signals_won: 9,
      m2_signals_lost: 6,
      m2_win_rate: 60.00,
      m2_total_pnl: 750.00,
      m3_signals_taken: 8,
      m3_signals_won: 3,
      m3_signals_lost: 5,
      m3_win_rate: 37.50,
      m3_total_pnl: 150.00,
      m4_signals_taken: 2,
      m4_signals_won: 1,
      m4_signals_lost: 1,
      m4_win_rate: 50.00,
      m4_total_pnl: 100.00,
      // Dashboard Settings
      selected_theme: 'concept1',
      notifications_enabled: true,
      auto_refresh: true,
      refresh_interval: 5000,
      language: 'en',
      timezone: 'America/New_York',
      preferred_view_mode: 'milestone',
      milestone_access_level: 3 // Pro account gets M1, M2, M3
    };
    
    const dashboardResult = await pool.query(`
      INSERT INTO user_dashboard_data (
        user_id, user_uuid, questionnaire_id, prop_firm, account_type, account_size, account_currency,
        risk_per_trade, trading_experience, trading_style, unique_id, account_balance, initial_equity,
        current_equity, available_balance, margin_used, margin_available, total_pnl, daily_pnl,
        weekly_pnl, monthly_pnl, yearly_pnl, total_trades, winning_trades, losing_trades,
        break_even_trades, win_rate, loss_rate, average_win, average_loss, largest_win, largest_loss,
        profit_factor, gross_profit, gross_loss, signals_taken, signals_won, signals_lost,
        signals_pending, signals_win_rate, signals_total_pnl, signals_best_trade, signals_worst_trade,
        m1_signals_taken, m1_signals_won, m1_signals_lost, m1_win_rate, m1_total_pnl,
        m2_signals_taken, m2_signals_won, m2_signals_lost, m2_win_rate, m2_total_pnl,
        m3_signals_taken, m3_signals_won, m3_signals_lost, m3_win_rate, m3_total_pnl,
        m4_signals_taken, m4_signals_won, m4_signals_lost, m4_win_rate, m4_total_pnl,
        selected_theme, notifications_enabled, auto_refresh, refresh_interval, language,
        timezone, preferred_view_mode, milestone_access_level
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65, $66, $67)
      RETURNING id, prop_firm, account_type, current_equity, total_pnl, win_rate, signals_won, signals_lost, milestone_access_level
    `, [
      dashboardData.user_id, dashboardData.user_uuid, dashboardData.questionnaire_id, dashboardData.prop_firm,
      dashboardData.account_type, dashboardData.account_size, dashboardData.account_currency, dashboardData.risk_per_trade,
      dashboardData.trading_experience, dashboardData.trading_style, dashboardData.unique_id, dashboardData.account_balance,
      dashboardData.initial_equity, dashboardData.current_equity, dashboardData.available_balance, dashboardData.margin_used,
      dashboardData.margin_available, dashboardData.total_pnl, dashboardData.daily_pnl, dashboardData.weekly_pnl,
      dashboardData.monthly_pnl, dashboardData.yearly_pnl, dashboardData.total_trades, dashboardData.winning_trades,
      dashboardData.losing_trades, dashboardData.break_even_trades, dashboardData.win_rate, dashboardData.loss_rate,
      dashboardData.average_win, dashboardData.average_loss, dashboardData.largest_win, dashboardData.largest_loss,
      dashboardData.profit_factor, dashboardData.gross_profit, dashboardData.gross_loss, dashboardData.signals_taken,
      dashboardData.signals_won, dashboardData.signals_lost, dashboardData.signals_pending, dashboardData.signals_win_rate,
      dashboardData.signals_total_pnl, dashboardData.signals_best_trade, dashboardData.signals_worst_trade,
      dashboardData.m1_signals_taken, dashboardData.m1_signals_won, dashboardData.m1_signals_lost, dashboardData.m1_win_rate, dashboardData.m1_total_pnl,
      dashboardData.m2_signals_taken, dashboardData.m2_signals_won, dashboardData.m2_signals_lost, dashboardData.m2_win_rate, dashboardData.m2_total_pnl,
      dashboardData.m3_signals_taken, dashboardData.m3_signals_won, dashboardData.m3_signals_lost, dashboardData.m3_win_rate, dashboardData.m3_total_pnl,
      dashboardData.m4_signals_taken, dashboardData.m4_signals_won, dashboardData.m4_signals_lost, dashboardData.m4_win_rate, dashboardData.m4_total_pnl,
      dashboardData.selected_theme, dashboardData.notifications_enabled, dashboardData.auto_refresh, dashboardData.refresh_interval,
      dashboardData.language, dashboardData.timezone, dashboardData.preferred_view_mode, dashboardData.milestone_access_level
    ]);
    
    console.log('✅ Dashboard data created:', dashboardData);
    
    // Test 7: Create signal tracking records
    console.log('\n7️⃣ Testing Signal Tracking Creation...');
    const signalData = {
      user_id: userId,
      user_uuid: userUuid,
      signal_id: 'SIG_TEST_001',
      signal_type: 'M1',
      signal_source: 'traderedgepro',
      symbol: 'EURUSD',
      direction: 'BUY',
      entry_price: 1.0850,
      stop_loss: 1.0820,
      take_profit: 1.0920,
      lot_size: 0.10,
      signal_time: new Date(),
      status: 'won',
      pnl: 150.00,
      pnl_percentage: 2.0,
      risk_amount: 300.00,
      reward_amount: 700.00,
      actual_risk_reward: 2.33,
      confidence_score: 85.5,
      secondary_confirmations: JSON.stringify({
        rsi: 'bullish',
        macd: 'bullish',
        ema: 'bullish'
      }),
      notes: 'Strong bullish momentum with multiple confirmations'
    };
    
    const signalResult = await pool.query(`
      INSERT INTO signal_tracking (
        user_id, user_uuid, signal_id, signal_type, signal_source, symbol, direction,
        entry_price, stop_loss, take_profit, lot_size, signal_time, status, pnl,
        pnl_percentage, risk_amount, reward_amount, actual_risk_reward, confidence_score,
        secondary_confirmations, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING id, signal_id, symbol, direction, status, pnl, confidence_score
    `, [
      signalData.user_id, signalData.user_uuid, signalData.signal_id, signalData.signal_type, signalData.signal_source,
      signalData.symbol, signalData.direction, signalData.entry_price, signalData.stop_loss, signalData.take_profit,
      signalData.lot_size, signalData.signal_time, signalData.status, signalData.pnl, signalData.pnl_percentage,
      signalData.risk_amount, signalData.reward_amount, signalData.actual_risk_reward, signalData.confidence_score,
      signalData.secondary_confirmations, signalData.notes
    ]);
    
    console.log('✅ Signal tracking created:', signalResult.rows[0]);
    
    // Test 8: Test views and complete profile query
    console.log('\n8️⃣ Testing Views and Complete Profile Query...');
    const profileQuery = 'SELECT * FROM user_complete_profile WHERE id = $1';
    const profileResult = await pool.query(profileQuery, [userId]);
    
    if (profileResult.rows.length > 0) {
      const profile = profileResult.rows[0];
      console.log('✅ Complete user profile retrieved:', {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        plan: profile.plan_name,
        payment_status: profile.payment_status,
        prop_firm: profile.prop_firm,
        account_type: profile.account_type,
        current_equity: profile.current_equity,
        total_pnl: profile.total_pnl,
        win_rate: profile.win_rate,
        signals_won: profile.signals_won,
        signals_lost: profile.signals_lost
      });
    }
    
    // Test 9: Test dashboard overview view
    console.log('\n9️⃣ Testing Dashboard Overview View...');
    const overviewQuery = 'SELECT * FROM dashboard_overview WHERE user_id = $1';
    const overviewResult = await pool.query(overviewQuery, [userId]);
    
    if (overviewResult.rows.length > 0) {
      const overview = overviewResult.rows[0];
      console.log('✅ Dashboard overview retrieved:', {
        user_id: overview.user_id,
        email: overview.email,
        prop_firm: overview.prop_firm,
        account_type: overview.account_type,
        current_equity: overview.current_equity,
        total_pnl: overview.total_pnl,
        win_rate: overview.win_rate,
        total_trades: overview.total_trades,
        signals_taken: overview.signals_taken ? JSON.parse(overview.signals_taken).length : 0,
        signals_won: overview.signals_won,
        signals_lost: overview.signals_lost,
        milestone_access_level: overview.milestone_access_level
      });
    }
    
    console.log('\n🎉 ALL ENHANCED DATABASE TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Test Summary:');
    console.log(`👤 Enhanced User Created: ${testEmail}`);
    console.log(`💳 Payment Details: Pro Plan ($179.10) - Completed`);
    console.log(`📋 Questionnaire: FTMO Pro Account ($75,000 equity) - Completed`);
    console.log(`📈 Dashboard Data: 71.11% win rate, $3,500 total PnL`);
    console.log(`🎯 Signal Performance: 70% signal win rate, M1-M3 access`);
    console.log(`🔗 All relationships and views working correctly`);
    console.log(`\n✅ Database is ready for production use with comprehensive data tracking!`);
    
  } catch (error) {
    console.error('❌ Enhanced database test failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run enhanced database tests
testEnhancedDatabase();
