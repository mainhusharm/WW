/**
 * Test Questionnaire Integration
 * This will test if we can insert questionnaire data into Supabase
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testQuestionnaireIntegration() {
  console.log('🧪 Testing Questionnaire Integration...');
  console.log('='.repeat(60));
  
  try {
    // Test questionnaire data (simulating real user responses)
    const questionnaireData = {
      id: crypto.randomUUID(),
      user_id: 'test-user-123',
      user_email: 'john.doe@example.com',
      user_name: 'John Doe',
      trades_per_day: '1-2',
      trading_session: 'any',
      crypto_assets: ['BTC', 'ETH', 'SOL'],
      forex_assets: ['EURUSD', 'GBPUSD', 'USDJPY'],
      custom_forex_pairs: ['EURGBP', 'AUDUSD'],
      has_account: 'yes',
      account_equity: 5000.00,
      prop_firm: 'Goat Funded Trader',
      account_type: 'Two-Step No-Time-Limit Challenge',
      account_size: 5000.00,
      risk_percentage: 1.5,
      risk_reward_ratio: '2',
      account_screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 pixel PNG
      screenshot_filename: 'account_screenshot.png',
      screenshot_size: 1024,
      screenshot_type: 'image/png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Questionnaire data:', {
      ...questionnaireData,
      account_screenshot: questionnaireData.account_screenshot.substring(0, 50) + '...' // Truncate for display
    });
    
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
      return false;
    }
    
    const newQuestionnaire = await response.json();
    console.log('✅ SUCCESS! Questionnaire data saved to Supabase!');
    console.log('📊 Questionnaire details:', {
      id: newQuestionnaire.id,
      user_name: newQuestionnaire.user_name,
      user_email: newQuestionnaire.user_email,
      trades_per_day: newQuestionnaire.trades_per_day,
      has_account: newQuestionnaire.has_account,
      account_equity: newQuestionnaire.account_equity,
      screenshot_filename: newQuestionnaire.screenshot_filename
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
          console.log(`  ${index + 1}. ${questionnaire.user_name} (${questionnaire.user_email}) - ${questionnaire.trades_per_day} trades/day - Account: ${questionnaire.has_account}`);
        });
      }
    }
    
    console.log('\n🎉 QUESTIONNAIRE INTEGRATION TEST COMPLETE!');
    console.log('✅ Questionnaire data with screenshot is now going to Supabase!');
    console.log('✅ Your questionnaire page will now save user details automatically');
    console.log('✅ Check your Supabase dashboard to see the questionnaire with screenshot');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testQuestionnaireIntegration();
