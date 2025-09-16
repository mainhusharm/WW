/**
 * Debug Questionnaire Page Integration
 * This will test if the questionnaire page is calling Supabase correctly
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function debugQuestionnairePage() {
  console.log('🔍 Debugging Questionnaire Page Integration...');
  console.log('='.repeat(60));
  
  try {
    // First, check if the table exists and what data is in it
    console.log('📋 Step 1: Checking questionnaire table...');
    const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details?select=*&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!tableResponse.ok) {
      console.error('❌ Table check failed:', tableResponse.status, tableResponse.statusText);
      const errorText = await tableResponse.text();
      console.error('Error details:', errorText);
      return false;
    }
    
    const tableData = await tableResponse.json();
    console.log('✅ Table exists and is accessible');
    console.log(`📊 Found ${tableData.length} questionnaires in table`);
    
    if (tableData.length > 0) {
      console.log('\n📋 Recent questionnaires:');
      tableData.forEach((questionnaire, index) => {
        console.log(`  ${index + 1}. ${questionnaire.user_name} (${questionnaire.user_email})`);
        console.log(`     - Trades per day: ${questionnaire.trades_per_day}`);
        console.log(`     - Has account: ${questionnaire.has_account}`);
        console.log(`     - Account equity: $${questionnaire.account_equity}`);
        console.log(`     - Screenshot: ${questionnaire.screenshot_filename || 'No screenshot'}`);
        console.log(`     - Created: ${questionnaire.created_at}`);
        console.log('');
      });
    } else {
      console.log('📝 No questionnaires found in table');
    }
    
    // Test with a simple questionnaire submission
    console.log('📋 Step 2: Testing simple questionnaire submission...');
    const simpleQuestionnaire = {
      id: crypto.randomUUID(),
      user_id: 'debug-user-456',
      user_email: 'debug@example.com',
      user_name: 'Debug User',
      trades_per_day: '3-5',
      trading_session: 'london',
      crypto_assets: ['BTC', 'ETH'],
      forex_assets: ['EURUSD', 'GBPUSD'],
      custom_forex_pairs: [],
      has_account: 'no',
      account_equity: null,
      prop_firm: null,
      account_type: null,
      account_size: null,
      risk_percentage: 2.0,
      risk_reward_ratio: '3',
      account_screenshot: null,
      screenshot_filename: null,
      screenshot_size: null,
      screenshot_type: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Simple questionnaire data:', simpleQuestionnaire);
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(simpleQuestionnaire)
    });
    
    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('❌ Simple insert failed:', insertResponse.status, insertResponse.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const newQuestionnaire = await insertResponse.json();
    console.log('✅ Simple questionnaire SUCCESS!');
    console.log('📊 New questionnaire:', newQuestionnaire);
    
    console.log('\n🎉 DEBUG COMPLETE!');
    console.log('✅ Questionnaire table is working');
    console.log('✅ Data can be inserted successfully');
    console.log('✅ Check your Supabase dashboard to see the questionnaires');
    
    return true;
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
    return false;
  }
}

// Run the debug
debugQuestionnairePage();
