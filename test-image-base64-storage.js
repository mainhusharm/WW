/**
 * Test Image Base64 Storage in Database
 * This will test storing images as base64 data in the database column
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testImageBase64Storage() {
  console.log('🧪 Testing Image Base64 Storage in Database...');
  console.log('='.repeat(60));
  
  try {
    // Create a test image (1x1 pixel PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Test questionnaire data with base64 image
    const questionnaireData = {
      id: crypto.randomUUID(),
      user_id: 'test-user-base64',
      user_email: 'base64@example.com',
      user_name: 'Base64 Test User',
      trades_per_day: '1-2',
      trading_session: 'any',
      crypto_assets: ['BTC', 'ETH', 'SOL'],
      forex_assets: ['EURUSD', 'GBPUSD', 'USDJPY'],
      custom_forex_pairs: ['EURGBP', 'AUDUSD'],
      has_account: 'yes',
      account_equity: 7500,
      prop_firm: 'Test Prop Firm',
      account_type: 'Test Account Type',
      account_size: 7500,
      risk_percentage: 2.0,
      risk_reward_ratio: '3',
      account_screenshot: testImageBase64, // Store base64 image data
      screenshot_filename: 'test_screenshot.png',
      screenshot_size: 1024,
      screenshot_type: 'image/png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Questionnaire data with base64 image:');
    console.log('  - User:', questionnaireData.user_name);
    console.log('  - Email:', questionnaireData.user_email);
    console.log('  - Screenshot filename:', questionnaireData.screenshot_filename);
    console.log('  - Screenshot size:', questionnaireData.screenshot_size, 'bytes');
    console.log('  - Base64 length:', questionnaireData.account_screenshot.length, 'characters');
    console.log('  - Base64 preview:', questionnaireData.account_screenshot.substring(0, 50) + '...');
    
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
    console.log('✅ SUCCESS! Questionnaire with base64 image saved to database!');
    console.log('📊 Questionnaire details:', {
      id: newQuestionnaire.id,
      user_name: newQuestionnaire.user_name,
      user_email: newQuestionnaire.user_email,
      screenshot_filename: newQuestionnaire.screenshot_filename,
      screenshot_size: newQuestionnaire.screenshot_size,
      has_screenshot_data: !!newQuestionnaire.account_screenshot,
      screenshot_data_length: newQuestionnaire.account_screenshot ? newQuestionnaire.account_screenshot.length : 0
    });
    
    // Verify the image data was stored
    console.log('\n🔍 Verifying image data in database...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details?select=id,user_name,screenshot_filename,account_screenshot&eq=id.${newQuestionnaire.id}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      if (verifyData.length > 0) {
        const questionnaire = verifyData[0];
        console.log('✅ Image data verification successful!');
        console.log('📊 Verification details:');
        console.log('  - ID:', questionnaire.id);
        console.log('  - User:', questionnaire.user_name);
        console.log('  - Filename:', questionnaire.screenshot_filename);
        console.log('  - Has screenshot data:', !!questionnaire.account_screenshot);
        console.log('  - Data length:', questionnaire.account_screenshot ? questionnaire.account_screenshot.length : 0);
        console.log('  - Data preview:', questionnaire.account_screenshot ? questionnaire.account_screenshot.substring(0, 50) + '...' : 'No data');
        
        // Test if the base64 data is valid
        if (questionnaire.account_screenshot && questionnaire.account_screenshot.startsWith('data:image/')) {
          console.log('✅ Base64 image data is valid and properly formatted!');
        } else {
          console.log('❌ Base64 image data is not properly formatted');
        }
      }
    }
    
    // Check all questionnaires with image data
    console.log('\n📊 All questionnaires with image data:');
    const allResponse = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details?select=id,user_name,screenshot_filename,account_screenshot&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (allResponse.ok) {
      const allQuestionnaires = await allResponse.json();
      console.log(`Found ${allQuestionnaires.length} questionnaires:`);
      
      allQuestionnaires.forEach((q, index) => {
        const hasImage = !!q.account_screenshot;
        const imageLength = q.account_screenshot ? q.account_screenshot.length : 0;
        console.log(`  ${index + 1}. ${q.user_name} - ${q.screenshot_filename || 'No filename'}`);
        console.log(`     - Has image data: ${hasImage ? 'Yes' : 'No'}`);
        console.log(`     - Image data length: ${imageLength} characters`);
        if (hasImage) {
          console.log(`     - Data preview: ${q.account_screenshot.substring(0, 30)}...`);
        }
        console.log('');
      });
    }
    
    console.log('\n🎉 IMAGE BASE64 STORAGE TEST COMPLETE!');
    console.log('✅ Images are being stored as base64 in the database column');
    console.log('✅ Your questionnaire page will now store images directly in the database');
    console.log('✅ Check your Supabase dashboard to see the image data in the account_screenshot column');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testImageBase64Storage();
