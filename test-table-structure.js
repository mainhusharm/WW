/**
 * Test Table Structure
 * This will check what columns exist in the payment details table
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testTableStructure() {
  console.log('🔍 Testing Payment Details Table Structure...');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Check if table exists and get its structure
    console.log('\n🔍 Test 1: Checking table structure...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.status === 404) {
      console.log('❌ Table does not exist yet');
      console.log('📝 You need to create the "payment details" table first');
      return false;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Table exists!');
    console.log('📊 Table structure (sample record):');
    
    if (data.length > 0) {
      console.log('Available columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty, but structure is accessible');
    }
    
    // Test 2: Try a simple insert with minimal data
    console.log('\n🔍 Test 2: Testing simple insert...');
    const simplePayment = {
      id: crypto.randomUUID(),
      user_id: 'test-user-123',
      plan_name_payment: 'Test Plan',
      original_price: 100,
      discount_amount: '0',
      final_price: 100,
      coupon_code: null,
      payment_method: 'test',
      payment_status: 'completed',
      transaction_id: 'TXN-123456',
      payment_processor: 'test'
    };
    
    console.log('Trying to insert:', simplePayment);
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(simplePayment)
    });
    
    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('❌ Insert failed:', insertResponse.status, insertResponse.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const newPayment = await insertResponse.json();
    console.log('✅ Insert successful!');
    console.log('📊 New payment:', newPayment);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testTableStructure();
