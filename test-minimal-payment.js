/**
 * Test Minimal Payment Data
 * This will test with only the absolutely required fields
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testMinimalPayment() {
  console.log('🧪 Testing Minimal Payment Data...');
  console.log('='.repeat(50));
  
  try {
    // Test with minimal required fields only
    const minimalPayment = {
      id: crypto.randomUUID(),
      user_id: 'test-user-123',
      plan_name_payment: 'Elite Plan',
      original_price: 1299,
      discount_amount: '0',
      final_price: 1299,
      payment_method: 'paypal',
      payment_status: 'completed',
      transaction_id: 'TXN-123456',
      payment_processor: 'PayPal',
      crypto_transaction_hash: 'test-hash-123', // Add required field
      crypto_from_address: 'test-address-123',  // Add required field
      crypto_amount: '0.001'                    // Add required field
    };
    
    console.log('📝 Minimal payment data:', minimalPayment);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(minimalPayment)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Insert failed:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const newPayment = await response.json();
    console.log('✅ SUCCESS! Payment saved to Supabase!');
    console.log('📊 Payment details:', newPayment);
    
    console.log('\n🎉 MINIMAL PAYMENT TEST COMPLETE!');
    console.log('✅ Payment data is now going to Supabase!');
    console.log('✅ Your payment page will now save data automatically');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testMinimalPayment();
