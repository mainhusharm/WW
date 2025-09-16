/**
 * Test New Payment Table
 * This will test if we can insert data into the new "payments" table
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testNewPaymentTable() {
  console.log('🧪 Testing New Payment Table...');
  console.log('='.repeat(50));
  
  try {
    // Test insert into new "payments" table
    const paymentData = {
      id: crypto.randomUUID(),
      user_id: 'test-user-123',
      plan_name: 'Elite Plan',
      original_price: 1299,
      discount_amount: 0,
      final_price: 1299,
      coupon_code: null,
      payment_method: 'paypal',
      payment_status: 'completed',
      transaction_id: 'TXN-123456',
      payment_provider: 'PayPal'
    };
    
    console.log('📝 Payment data:', paymentData);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
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
    console.log('✅ SUCCESS! Payment saved to new table!');
    console.log('📊 Payment details:', newPayment);
    
    // Verify the payment was added
    console.log('\n🔍 Verifying payment was added...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/payments?select=*&limit=5`, {
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
        allPayments.forEach((payment, index) => {
          console.log(`  ${index + 1}. ${payment.plan_name} - $${payment.final_price} - ${payment.payment_status}`);
        });
      }
    }
    
    console.log('\n🎉 NEW PAYMENT TABLE TEST COMPLETE!');
    console.log('✅ The new "payments" table is working perfectly');
    console.log('✅ Payment data can now be saved to Supabase');
    console.log('✅ Check your Supabase dashboard to see the new payment');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testNewPaymentTable();
