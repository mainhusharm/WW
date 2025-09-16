/**
 * Test Image Storage in Supabase
 * This will test uploading images to Supabase Storage
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testImageStorage() {
  console.log('🧪 Testing Image Storage in Supabase...');
  console.log('='.repeat(60));
  
  try {
    // First, check if the storage bucket exists
    console.log('📋 Step 1: Checking storage bucket...');
    const bucketResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/questionnaire-screenshots`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!bucketResponse.ok) {
      console.error('❌ Storage bucket check failed:', bucketResponse.status, bucketResponse.statusText);
      console.log('💡 You need to create the "questionnaire-screenshots" bucket in Supabase Storage');
      console.log('💡 Go to Storage > Create Bucket > Name: "questionnaire-screenshots" > Public: Yes');
      return false;
    }
    
    const bucketData = await bucketResponse.json();
    console.log('✅ Storage bucket exists:', bucketData.name);
    
    // Test uploading a simple image (1x1 pixel PNG)
    console.log('\n📋 Step 2: Testing image upload...');
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    const fileName = `test_${Date.now()}.png`;
    const filePath = `questionnaire-screenshots/${fileName}`;
    
    console.log('📝 Uploading test image:', fileName);
    
    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/questionnaire-screenshots/${filePath}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'image/png'
      },
      body: testImageBuffer
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Image upload failed:', uploadResponse.status, uploadResponse.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ Image uploaded successfully!');
    console.log('📊 Upload data:', uploadData);
    
    // Get the public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/questionnaire-screenshots/${filePath}`;
    console.log('🔗 Public URL:', publicUrl);
    
    // Test questionnaire with image URL
    console.log('\n📋 Step 3: Testing questionnaire with image URL...');
    const questionnaireData = {
      id: crypto.randomUUID(),
      user_id: 'test-user-image',
      user_email: 'image@example.com',
      user_name: 'Image Test User',
      trades_per_day: '1-2',
      trading_session: 'any',
      crypto_assets: ['BTC', 'ETH'],
      forex_assets: ['EURUSD', 'GBPUSD'],
      custom_forex_pairs: [],
      has_account: 'yes',
      account_equity: 5000,
      prop_firm: 'Test Prop Firm',
      account_type: 'Test Account',
      account_size: 5000,
      risk_percentage: 1.5,
      risk_reward_ratio: '2',
      screenshot_url: publicUrl, // Store the image URL
      screenshot_filename: fileName,
      screenshot_size: testImageBuffer.length,
      screenshot_type: 'image/png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Questionnaire data with image URL:', {
      ...questionnaireData,
      screenshot_url: questionnaireData.screenshot_url.substring(0, 50) + '...'
    });
    
    const questionnaireResponse = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(questionnaireData)
    });
    
    if (!questionnaireResponse.ok) {
      const errorText = await questionnaireResponse.text();
      console.error('❌ Questionnaire insert failed:', questionnaireResponse.status, questionnaireResponse.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const newQuestionnaire = await questionnaireResponse.json();
    console.log('✅ Questionnaire with image URL saved successfully!');
    console.log('📊 Questionnaire details:', {
      id: newQuestionnaire.id,
      user_name: newQuestionnaire.user_name,
      screenshot_url: newQuestionnaire.screenshot_url,
      screenshot_filename: newQuestionnaire.screenshot_filename
    });
    
    console.log('\n🎉 IMAGE STORAGE TEST COMPLETE!');
    console.log('✅ Images can be uploaded to Supabase Storage');
    console.log('✅ Questionnaire data with image URLs can be saved');
    console.log('✅ Your questionnaire page will now store proper images!');
    console.log(`🔗 Test image URL: ${publicUrl}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testImageStorage();
