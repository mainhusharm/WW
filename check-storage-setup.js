/**
 * Check Storage Setup
 * This will check if the storage bucket exists and is properly configured
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function checkStorageSetup() {
  console.log('🔍 Checking Storage Setup...');
  console.log('='.repeat(50));
  
  try {
    // Check if storage bucket exists
    console.log('📋 Step 1: Checking storage bucket...');
    const bucketResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/questionnaire-screenshots`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', bucketResponse.status);
    console.log('Response status text:', bucketResponse.statusText);
    
    if (bucketResponse.ok) {
      const bucketData = await bucketResponse.json();
      console.log('✅ Storage bucket exists!');
      console.log('📊 Bucket details:', bucketData);
      
      // Check if bucket is public
      if (bucketData.public) {
        console.log('✅ Bucket is public - images will be accessible via URL');
      } else {
        console.log('⚠️ Bucket is private - images won\'t be accessible via URL');
      }
      
    } else {
      const errorText = await bucketResponse.text();
      console.log('❌ Storage bucket does not exist');
      console.log('Error details:', errorText);
      
      if (bucketResponse.status === 404) {
        console.log('\n💡 SOLUTION: Create the storage bucket in Supabase');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Click "Storage" in the left sidebar');
        console.log('3. Click "Create Bucket"');
        console.log('4. Name: "questionnaire-screenshots"');
        console.log('5. Public: Yes');
        console.log('6. Click "Create Bucket"');
      }
    }
    
    // Check if we can list files in the bucket
    console.log('\n📋 Step 2: Checking bucket contents...');
    const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/list/questionnaire-screenshots`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (listResponse.ok) {
      const files = await listResponse.json();
      console.log('✅ Can access bucket contents');
      console.log(`📊 Found ${files.length} files in bucket`);
      
      if (files.length > 0) {
        console.log('Files in bucket:');
        files.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.name} (${file.size} bytes)`);
        });
      } else {
        console.log('📝 Bucket is empty - no files uploaded yet');
      }
    } else {
      console.log('❌ Cannot access bucket contents');
      const errorText = await listResponse.text();
      console.log('Error details:', errorText);
    }
    
    // Check database table for image URLs
    console.log('\n📋 Step 3: Checking database for image URLs...');
    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire%20details?select=screenshot_url,screenshot_filename&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (dbResponse.ok) {
      const questionnaires = await dbResponse.json();
      console.log('✅ Can access database');
      console.log(`📊 Found ${questionnaires.length} questionnaires with image data`);
      
      questionnaires.forEach((q, index) => {
        console.log(`  ${index + 1}. ${q.screenshot_filename || 'No filename'}`);
        console.log(`     URL: ${q.screenshot_url ? q.screenshot_url.substring(0, 50) + '...' : 'No URL'}`);
      });
    } else {
      console.log('❌ Cannot access database');
      const errorText = await dbResponse.text();
      console.log('Error details:', errorText);
    }
    
    console.log('\n🎉 STORAGE SETUP CHECK COMPLETE!');
    
  } catch (error) {
    console.error('❌ Check failed with error:', error);
  }
}

// Run the check
checkStorageSetup();
