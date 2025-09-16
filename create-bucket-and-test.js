/**
 * Create Bucket and Test Image Upload
 * This will try to create the bucket and upload a test image
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function createBucketAndTest() {
  console.log('🔧 Creating Bucket and Testing Image Upload...');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Try to create the bucket
    console.log('📋 Step 1: Creating storage bucket...');
    const createBucketResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'questionnaire-screenshots',
        name: 'questionnaire-screenshots',
        public: true
      })
    });
    
    if (createBucketResponse.ok) {
      const bucketData = await createBucketResponse.json();
      console.log('✅ Storage bucket created successfully!');
      console.log('📊 Bucket details:', bucketData);
    } else {
      const errorText = await createBucketResponse.text();
      console.log('❌ Failed to create bucket:', createBucketResponse.status, createBucketResponse.statusText);
      console.log('Error details:', errorText);
      
      if (createBucketResponse.status === 409) {
        console.log('💡 Bucket already exists, continuing with test...');
      } else {
        console.log('💡 You need to create the bucket manually in Supabase dashboard');
        console.log('1. Go to Storage > Create Bucket');
        console.log('2. Name: "questionnaire-screenshots"');
        console.log('3. Public: Yes');
        return false;
      }
    }
    
    // Step 2: Test image upload
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
    
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Image uploaded successfully!');
      console.log('📊 Upload data:', uploadData);
      
      // Get the public URL
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/questionnaire-screenshots/${filePath}`;
      console.log('🔗 Public URL:', publicUrl);
      
      // Test if the image is accessible
      console.log('\n📋 Step 3: Testing image accessibility...');
      const imageResponse = await fetch(publicUrl);
      if (imageResponse.ok) {
        console.log('✅ Image is accessible via public URL!');
        console.log('📊 Image size:', imageResponse.headers.get('content-length'), 'bytes');
      } else {
        console.log('❌ Image is not accessible via public URL');
        console.log('Status:', imageResponse.status, imageResponse.statusText);
      }
      
    } else {
      const errorText = await uploadResponse.text();
      console.log('❌ Image upload failed:', uploadResponse.status, uploadResponse.statusText);
      console.log('Error details:', errorText);
      
      if (uploadResponse.status === 404) {
        console.log('💡 Bucket does not exist. Please create it manually in Supabase dashboard');
      }
    }
    
    console.log('\n🎉 BUCKET CREATION AND TEST COMPLETE!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
createBucketAndTest();
