/**
 * Test Questionnaire Page Flow
 * This simulates what happens when someone actually submits the questionnaire
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testQuestionnairePageFlow() {
  console.log('🧪 Testing Questionnaire Page Flow...');
  console.log('='.repeat(60));
  
  try {
    // Simulate a real user submitting the questionnaire
    const userData = {
      id: 'real-user-789',
      email: 'realuser@example.com',
      fullName: 'Real User',
      name: 'Real User'
    };
    
    const questionnaireAnswers = {
      tradesPerDay: '1-2',
      tradingSession: 'any',
      cryptoAssets: ['BTC', 'ETH', 'SOL', 'XRP'],
      forexAssets: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD'],
      hasAccount: 'yes',
      accountEquity: 10000,
      propFirm: 'QuantTekel',
      accountType: 'Instant Funding',
      accountSize: 15000,
      riskPercentage: 1.5,
      riskRewardRatio: '2'
    };
    
    const customPairs = ['EURGBP', 'AUDUSD', 'NZDUSD'];
    
    // Simulate the saveQuestionnaireToSupabase function
    console.log('📝 Simulating questionnaire submission...');
    console.log('User:', userData);
    console.log('Answers:', questionnaireAnswers);
    
    // Create a simple base64 image for testing
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const supabaseQuestionnaireData = {
      id: crypto.randomUUID(),
      user_id: userData.id,
      user_email: userData.email,
      user_name: userData.fullName || userData.name,
      trades_per_day: questionnaireAnswers.tradesPerDay,
      trading_session: questionnaireAnswers.tradingSession,
      crypto_assets: questionnaireAnswers.cryptoAssets || [],
      forex_assets: questionnaireAnswers.forexAssets || [],
      custom_forex_pairs: customPairs || [],
      has_account: questionnaireAnswers.hasAccount,
      account_equity: questionnaireAnswers.hasAccount === 'yes' ? parseFloat(questionnaireAnswers.accountEquity.toString()) : null,
      prop_firm: questionnaireAnswers.propFirm || null,
      account_type: questionnaireAnswers.accountType || null,
      account_size: questionnaireAnswers.accountSize ? parseFloat(questionnaireAnswers.accountSize.toString()) : null,
      risk_percentage: questionnaireAnswers.riskPercentage,
      risk_reward_ratio: questionnaireAnswers.riskRewardRatio,
      account_screenshot: testImageBase64,
      screenshot_filename: 'real_user_screenshot.png',
      screenshot_size: 2048,
      screenshot_type: 'image/png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📊 Supabase data:', {
      ...supabaseQuestionnaireData,
      account_screenshot: supabaseQuestionnaireData.account_screenshot.substring(0, 50) + '...'
    });
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(supabaseQuestionnaireData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Questionnaire submission failed:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const newQuestionnaire = await response.json();
    console.log('✅ SUCCESS! Real user questionnaire saved to Supabase!');
    console.log('📊 Questionnaire details:', {
      id: newQuestionnaire.id,
      user_name: newQuestionnaire.user_name,
      user_email: newQuestionnaire.user_email,
      trades_per_day: newQuestionnaire.trades_per_day,
      has_account: newQuestionnaire.has_account,
      account_equity: newQuestionnaire.account_equity,
      screenshot_filename: newQuestionnaire.screenshot_filename
    });
    
    // Check all questionnaires in the table
    console.log('\n🔍 Checking all questionnaires in table...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details?select=*&order=created_at.desc&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const allQuestionnaires = await verifyResponse.json();
      console.log(`✅ Found ${allQuestionnaires.length} total questionnaires in table`);
      
      console.log('\n📊 All questionnaires:');
      allQuestionnaires.forEach((questionnaire, index) => {
        console.log(`  ${index + 1}. ${questionnaire.user_name} (${questionnaire.user_email})`);
        console.log(`     - Trades per day: ${questionnaire.trades_per_day}`);
        console.log(`     - Has account: ${questionnaire.has_account}`);
        console.log(`     - Account equity: $${questionnaire.account_equity || 'N/A'}`);
        console.log(`     - Screenshot: ${questionnaire.screenshot_filename || 'No screenshot'}`);
        console.log(`     - Created: ${questionnaire.created_at}`);
        console.log('');
      });
    }
    
    console.log('\n🎉 QUESTIONNAIRE PAGE FLOW TEST COMPLETE!');
    console.log('✅ The questionnaire integration is working perfectly!');
    console.log('✅ Data is being saved to Supabase successfully!');
    console.log('✅ Check your Supabase dashboard to see all the questionnaires');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testQuestionnairePageFlow();
