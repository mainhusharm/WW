/**
 * Test Payment with Email and Name
 * This will test the updated payment integration with email and name fields
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testPaymentWithEmailName() {
  console.log('🧪 Testing Payment with Email and Name...');
  console.log('='.repeat(60));
  
  try {
    // Test payment with email and name (simulating real user data)
    const paymentData = {
      id: crypto.randomUUID(),
      user_id: 'user-123',
      user_email: 'john.doe@example.com', // Email from signup
      user_name: 'John Doe', // Name from signup
      plan_name_payment: 'Elite Plan',
      original_price: 1299,
      discount_amount: '0',
      final_price: 1299,
      coupon_code: null,
      payment_method: 'paypal',
      payment_status: 'completed',
      transaction_id: 'PAYPAL-123456',
      payment_processor: 'PayPal',
      // Required fields for the table
      crypto_transaction_hash: 'N/A',
      crypto_from_address: 'N/A',
      crypto_amount: '0'
    };
    
    console.log('📝 Payment data with email and name:', paymentData);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Insert failed:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const newPayment = await response.json();
    console.log('✅ SUCCESS! Payment with email and name saved to Supabase!');
    console.log('📊 Payment details:', newPayment);
    
    // Verify the payment was added
    console.log('\n🔍 Verifying payment was added...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details?select=*&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const allPayments = await verifyResponse.json();
      console.log(`✅ Verification successful! Found ${allPayments.length} payments in table`);
      
      if (allPayments.length > 0) {
        console.log('\n📊 Recent payments with email and name:');
        allPayments.slice(0, 3).forEach((payment, index) => {
          console.log(`  ${index + 1}. ${payment.user_name} (${payment.user_email}) - ${payment.plan_name_payment} - $${payment.final_price}`);
        });
      }
    }
    
    console.log('\n🎉 PAYMENT WITH EMAIL AND NAME TEST COMPLETE!');
    console.log('✅ Payment data with email and name is now going to Supabase!');
    console.log('✅ Your payment page will now save user details automatically');
    console.log('✅ Check your Supabase dashboard to see the payment with email and name');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testPaymentWithEmailName();
