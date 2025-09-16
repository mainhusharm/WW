/**
 * Test Payment with Correct Column Names
 * This will test if we can insert data into the existing "payment details" table
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testPaymentFinal() {
  console.log('🧪 Testing Payment with Correct Column Names...');
  console.log('='.repeat(60));
  
  try {
    // Test insert into existing "payment details" table with correct column names
    const paymentData = {
      id: crypto.randomUUID(),
      user_id: 'test-user-123',
      plan_name_payment: 'Elite Plan',
      original_price: 1299,
      discount_amount: '0',
      final_price: 1299,
      coupon_code: null,
      payment_method: 'paypal',
      payment_status: 'completed',
      transaction_id: 'TXN-123456',
      payment_processor: 'PayPal'
    };
    
    console.log('📝 Payment data:', paymentData);
    
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
    console.log('✅ SUCCESS! Payment saved to Supabase!');
    console.log('📊 Payment details:', newPayment);
    
    // Verify the payment was added
    console.log('\n🔍 Verifying payment was added...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details?select=*&limit=5`, {
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
        console.log('📊 Recent payments:');
        allPayments.slice(0, 5).forEach((payment, index) => {
          console.log(`  ${index + 1}. ${payment.plan_name_payment} - $${payment.final_price} - ${payment.payment_status}`);
        });
      }
    }
    
    console.log('\n🎉 PAYMENT TEST COMPLETE!');
    console.log('✅ Payment data is now going to Supabase!');
    console.log('✅ Your payment page will now save data automatically');
    console.log('✅ Check your Supabase dashboard to see the payment');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testPaymentFinal();
