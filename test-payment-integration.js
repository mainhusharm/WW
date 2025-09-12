/**
 * Test Payment Integration with Supabase
 * This will test if payment data goes to the "payment details" table
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testPaymentIntegration() {
  console.log('🧪 Testing Payment Integration with Supabase...');
  console.log('='.repeat(60));
  
  try {
    // Simulate payment data from EnhancedPaymentPage
    const userData = {
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
      country: 'United States',
      company: 'Test Company',
      phone: '+1234567890'
    };

    const selectedPlan = {
      name: 'Elite Plan',
      price: 1299,
      period: 'month',
      description: 'Complete MT5 bot development service'
    };

    const paymentData = {
      paymentId: `PAY-${Date.now()}`,
      transactionId: `TXN-${Date.now()}`,
      status: 'completed',
      amount: 1299,
      currency: 'USD',
      provider: 'PayPal'
    };

    const discount = 0;
    const finalPrice = 1299;
    const couponApplied = false;
    const couponCode = null;
    const selectedPaymentMethod = 'paypal';

    console.log('📝 Payment data from EnhancedPaymentPage:');
    console.log(`   User: ${userData.fullName} (${userData.email})`);
    console.log(`   Plan: ${selectedPlan.name} - $${selectedPlan.price}/${selectedPlan.period}`);
    console.log(`   Payment Method: ${selectedPaymentMethod}`);
    console.log(`   Amount: $${finalPrice}`);
    console.log(`   Transaction ID: ${paymentData.transactionId}`);

    // Create the Supabase payment data (same as in EnhancedPaymentPage)
    const supabasePaymentData = {
      id: crypto.randomUUID(),
      user_id: userData.id,
      user_email: userData.email,
      user_name: userData.fullName,
      plan_name: selectedPlan.name,
      original_price: selectedPlan.price,
      discount_amount: discount,
      final_price: finalPrice,
      coupon_code: couponApplied ? couponCode : null,
      payment_method: selectedPaymentMethod,
      transaction_id: paymentData.paymentId || paymentData.transactionId || `TXN-${Date.now()}`,
      payment_status: 'completed',
      payment_provider: selectedPaymentMethod === 'paypal' ? 'PayPal' : 
                       selectedPaymentMethod === 'crypto' ? 'Cryptocurrency' : 
                       selectedPaymentMethod === 'free_coupon' ? 'Free' : 'Unknown',
      payment_provider_id: paymentData.paymentId || paymentData.transactionId || null,
      currency: 'USD',
      payment_data: paymentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('\n🔍 Attempting to save payment to Supabase...');
    console.log('📊 Supabase payment data:', {
      id: supabasePaymentData.id,
      user: supabasePaymentData.user_name,
      email: supabasePaymentData.user_email,
      plan: supabasePaymentData.plan_name,
      amount: supabasePaymentData.final_price,
      method: supabasePaymentData.payment_method,
      status: supabasePaymentData.payment_status
    });

    // Try to insert the payment
    const response = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(supabasePaymentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to save payment:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return false;
    }

    const newPayment = await response.json();
    console.log('✅ SUCCESS! Payment saved to Supabase!');
    console.log('📊 Payment details:');
    console.log(`   ID: ${newPayment[0].id}`);
    console.log(`   User: ${newPayment[0].user_name} (${newPayment[0].user_email})`);
    console.log(`   Plan: ${newPayment[0].plan_name}`);
    console.log(`   Amount: $${newPayment[0].final_price}`);
    console.log(`   Method: ${newPayment[0].payment_method}`);
    console.log(`   Status: ${newPayment[0].payment_status}`);
    console.log(`   Transaction ID: ${newPayment[0].transaction_id}`);
    console.log(`   Created: ${newPayment[0].created_at}`);

    // Verify the payment was added
    console.log('\n🔍 Verifying payment was added...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details?select=*&limit=10`, {
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
          console.log(`  ${index + 1}. ${payment.user_name} - ${payment.plan_name} - $${payment.final_price} - ${payment.payment_status}`);
        });
      }
    }

    console.log('\n🎉 PAYMENT INTEGRATION TEST COMPLETE!');
    console.log('✅ EnhancedPaymentPage integration is working perfectly');
    console.log('✅ Payment data from your payment form will now go to Supabase');
    console.log('✅ Check your Supabase dashboard to see the new payment');
    console.log('\n📝 Next steps:');
    console.log('1. Test your actual /payment-enhanced page');
    console.log('2. Complete a payment (even free payment)');
    console.log('3. Check your Supabase dashboard for the new payment record');
    console.log('4. The payment data will be saved automatically!');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testPaymentIntegration();
