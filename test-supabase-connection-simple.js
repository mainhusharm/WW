/**
 * Simple Supabase Connection Test
 * This will test if we can connect to Supabase from the main project
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection from Main Project...');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Check if we can connect to the table
    console.log('\n🔍 Test 1: Checking table connection...');
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/User%20details?select=count`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('❌ Table connection failed:', testResponse.status, testResponse.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const countData = await testResponse.json();
    console.log('✅ Table connection successful!');
    console.log('📊 Count data:', countData);
    
    // Test 2: Get existing data
    console.log('\n🔍 Test 2: Getting existing data...');
    const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/User%20details?select=*&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      console.error('❌ Failed to get existing data:', getResponse.status, getResponse.statusText);
      return false;
    }
    
    const existingUsers = await getResponse.json();
    console.log(`✅ Found ${existingUsers.length} existing users in the table`);
    
    if (existingUsers.length > 0) {
      console.log('📊 Sample existing user:', {
        id: existingUsers[0].id,
        email: existingUsers[0].email,
        name: `${existingUsers[0].first_name} ${existingUsers[0].last_name}`,
        status: existingUsers[0].status
      });
    }
    
    // Test 3: Try to insert a test user
    console.log('\n🔍 Test 3: Testing data insertion...');
    const testUser = {
      id: crypto.randomUUID(),
      first_name: 'Debug',
      last_name: 'Test',
      email: `debug.test.${Date.now()}@example.com`,
      phone: '+1234567890',
      company: 'Debug Company',
      country: 'United States',
      language: 'English',
      password_hash: '$2b$10$testhash123456789',
      agree_to_terms: true,
      agree_to_marketing: false,
      trading_experience_signup: 'beginner',
      trading_goals_signup: 'Make consistent profits',
      risk_tolerance_signup: 'moderate',
      preferred_markets: 'forex',
      trading_style: 'day',
      status: 'PENDING',
      membership_tier: 'free',
      account_type: 'personal',
      setup_complete: false,
      is_temporary: false,
      unique_id: `DEBUG-${Date.now()}`,
      token: `TOKEN-${Date.now()}`,
      selected_plan: {
        name: 'Debug Plan',
        price: 0,
        features: ['Debug features']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/User%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testUser)
    });
    
    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('❌ Insert failed:', insertResponse.status, insertResponse.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const newUser = await insertResponse.json();
    console.log('✅ Insert successful!');
    console.log('📊 New user:', {
      id: newUser[0].id,
      name: `${newUser[0].first_name} ${newUser[0].last_name}`,
      email: newUser[0].email,
      status: newUser[0].status
    });
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Supabase connection is working from main project');
    console.log('✅ Data insertion is working');
    console.log('✅ The issue might be in the React component integration');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testSupabaseConnection();
