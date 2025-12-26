const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
  ssl: {
    rejectUnauthorized: false
  }
};

async function testDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🧪 Testing database connection and operations...');
    
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const timeResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful:', timeResult.rows[0].current_time);
    
    // Test 2: Check if tables exist
    console.log('\n2️⃣ Checking if tables exist...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_subscriptions', 'user_questionnaire', 'user_dashboard_settings', 'signal_meta')
      ORDER BY table_name;
    `;
    const tablesResult = await pool.query(tablesQuery);
    console.log('📋 Existing tables:', tablesResult.rows.map(row => row.table_name));
    
    // Test 3: Create test user
    console.log('\n3️⃣ Creating test user...');
    const testEmail = 'test@traderedgepro.com';
    const testPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    // Check if test user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [testEmail]);
    
    let userId;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log('👤 Test user already exists:', userId);
    } else {
      const userResult = await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, country)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, first_name, last_name, created_at
      `, [testEmail, hashedPassword, 'Test', 'User', 'United States']);
      
      userId = userResult.rows[0].id;
      console.log('✅ Test user created:', userResult.rows[0]);
    }
    
    // Test 4: Create test subscription
    console.log('\n4️⃣ Creating test subscription...');
    const subscriptionResult = await pool.query(`
      INSERT INTO user_subscriptions (user_id, plan_type, plan_name, amount, billing_cycle, starts_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id, plan_name, amount, status
    `, [userId, 'pro', 'Pro Plan', 99.99, 'monthly', new Date()]);
    
    if (subscriptionResult.rows.length > 0) {
      console.log('✅ Test subscription created:', subscriptionResult.rows[0]);
    } else {
      console.log('📋 Test subscription already exists');
    }
    
    // Test 5: Create test questionnaire
    console.log('\n5️⃣ Creating test questionnaire...');
    const questionnaireResult = await pool.query(`
      INSERT INTO user_questionnaire (
        user_id, account_equity, account_type, account_number, 
        trading_experience, risk_tolerance, preferred_instruments,
        daily_risk_limit, max_drawdown_percent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        account_equity = EXCLUDED.account_equity,
        account_type = EXCLUDED.account_type,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, account_equity, account_type, trading_experience
    `, [
      userId, 
      50000.00, 
      'Pro', 
      'TEST123456', 
      'intermediate', 
      'medium', 
      ['EURUSD', 'GBPUSD', 'USDJPY'],
      1000.00,
      5.00
    ]);
    
    console.log('✅ Test questionnaire created:', questionnaireResult.rows[0]);
    
    // Test 6: Check dashboard settings (should be auto-created by trigger)
    console.log('\n6️⃣ Checking dashboard settings...');
    const dashboardResult = await pool.query(`
      SELECT id, current_equity, milestone_access_level, preferred_view_mode
      FROM user_dashboard_settings 
      WHERE user_id = $1
    `, [userId]);
    
    if (dashboardResult.rows.length > 0) {
      console.log('✅ Dashboard settings found:', dashboardResult.rows[0]);
    } else {
      console.log('⚠️  Dashboard settings not found - trigger may not have fired');
    }
    
    // Test 7: Test complete user profile query
    console.log('\n7️⃣ Testing complete user profile query...');
    const profileQuery = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.created_at,
        s.plan_name, s.amount, s.status as subscription_status,
        q.account_equity, q.account_type, q.trading_experience,
        d.milestone_access_level, d.preferred_view_mode, d.current_equity
      FROM users u
      LEFT JOIN user_subscriptions s ON u.id = s.user_id AND s.status = 'active'
      LEFT JOIN user_questionnaire q ON u.id = q.user_id
      LEFT JOIN user_dashboard_settings d ON u.id = d.user_id
      WHERE u.id = $1
    `;
    
    const profileResult = await pool.query(profileQuery, [userId]);
    console.log('✅ Complete user profile:', profileResult.rows[0]);
    
    // Test 8: Test milestone access mapping
    console.log('\n8️⃣ Testing milestone access mapping...');
    const accountTypes = ['Demo', 'Beginner', 'Standard', 'Pro', 'Experienced', 'Funded', 'Evaluation'];
    
    for (const accountType of accountTypes) {
      const accessLevel = getMilestoneAccessLevel(accountType);
      const milestones = getMilestoneNames(accessLevel);
      console.log(`${accountType}: Level ${accessLevel} → ${milestones.join(', ')}`);
    }
    
    console.log('\n🎉 All database tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`👤 Test User ID: ${userId}`);
    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`🔑 Test Password: ${testPassword}`);
    console.log(`💳 Account Type: Pro (Access Level 3 - M1, M2, M3)`);
    console.log(`💰 Account Equity: $50,000`);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Helper functions
function getMilestoneAccessLevel(accountType) {
  switch (accountType) {
    case 'Demo':
    case 'Beginner':
      return 1; // M1 only
    case 'Standard':
      return 2; // M1, M2
    case 'Pro':
    case 'Experienced':
      return 3; // M1, M2, M3
    case 'Funded':
    case 'Evaluation':
      return 4; // All milestones
    default:
      return 1; // Default to M1 only
  }
}

function getMilestoneNames(accessLevel) {
  const milestones = ['M1'];
  if (accessLevel >= 2) milestones.push('M2');
  if (accessLevel >= 3) milestones.push('M3');
  if (accessLevel >= 4) milestones.push('M4');
  return milestones;
}

// Run tests
testDatabase();
