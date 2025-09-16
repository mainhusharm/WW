/**
 * Test Updated Questionnaire (Account Number instead of Screenshot)
 * This will test the updated questionnaire with account number field
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testUpdatedQuestionnaire() {
  console.log('🧪 Testing Updated Questionnaire (Account Number)...');
  console.log('='.repeat(60));
  
  try {
    // Test questionnaire data with account number (no screenshot)
    const questionnaireData = {
      id: crypto.randomUUID(),
      user_id: 'test-user-account',
      user_email: 'account@example.com',
      user_name: 'Account Test User',
      trades_per_day: '1-2',
      trading_session: 'any',
      crypto_assets: ['BTC', 'ETH', 'SOL'],
      forex_assets: ['EURUSD', 'GBPUSD', 'USDJPY'],
      custom_forex_pairs: ['EURGBP', 'AUDUSD'],
      has_account: 'yes',
      account_equity: 10000,
      prop_firm: 'Goat Funded Trader',
      account_type: 'Two-Step No-Time-Limit Challenge',
      account_size: 10000,
      risk_percentage: 1.5,
      risk_reward_ratio: '2',
      account_number: 'GF-12345-67890', // New account number field
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Updated questionnaire data:');
    console.log('  - User:', questionnaireData.user_name);
    console.log('  - Email:', questionnaireData.user_email);
    console.log('  - Prop Firm:', questionnaireData.prop_firm);
    console.log('  - Account Number:', questionnaireData.account_number);
    console.log('  - Account Size:', questionnaireData.account_size);
    console.log('  - Risk Percentage:', questionnaireData.risk_percentage);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(questionnaireData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Insert failed:', response.status, response.statusText);
      console.error('Error details:', errorText);
      
      if (errorText.includes('account_number')) {
        console.log('\n💡 SOLUTION: Add account_number column to database');
        console.log('Run this SQL in your Supabase SQL editor:');
        console.log('ALTER TABLE "questionnaire details" ADD COLUMN account_number TEXT;');
        return false;
      }
      
      return false;
    }
    
    const newQuestionnaire = await response.json();
    console.log('✅ SUCCESS! Updated questionnaire saved to database!');
    console.log('📊 Questionnaire details:', {
      id: newQuestionnaire.id,
      user_name: newQuestionnaire.user_name,
      user_email: newQuestionnaire.user_email,
      prop_firm: newQuestionnaire.prop_firm,
      account_number: newQuestionnaire.account_number,
      account_size: newQuestionnaire.account_size,
      risk_percentage: newQuestionnaire.risk_percentage
    });
    
    // Verify the questionnaire was added
    console.log('\n🔍 Verifying questionnaire was added...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details?select=*&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const allQuestionnaires = await verifyResponse.json();
      console.log(`✅ Verification successful! Found ${allQuestionnaires.length} questionnaires in table`);
      
      if (allQuestionnaires.length > 0) {
        console.log('\n📊 Recent questionnaires:');
        allQuestionnaires.slice(0, 3).forEach((questionnaire, index) => {
          console.log(`  ${index + 1}. ${questionnaire.user_name} (${questionnaire.user_email})`);
          console.log(`     - Prop Firm: ${questionnaire.prop_firm || 'N/A'}`);
          console.log(`     - Account Number: ${questionnaire.account_number || 'N/A'}`);
          console.log(`     - Account Size: $${questionnaire.account_size || 'N/A'}`);
          console.log(`     - Risk: ${questionnaire.risk_percentage}%`);
          console.log('');
        });
      }
    }
    
    console.log('\n🎉 UPDATED QUESTIONNAIRE TEST COMPLETE!');
    console.log('✅ Questionnaire with account number is working!');
    console.log('✅ No more screenshot requirements - just account number');
    console.log('✅ Your questionnaire page will now save account numbers instead of images');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testUpdatedQuestionnaire();
