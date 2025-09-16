/**
 * Debug Payment Page Integration
 * This will test if the payment page is calling Supabase correctly
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function debugPaymentPage() {
  console.log('🔍 Debugging Payment Page Integration...');
  console.log('='.repeat(60));
  
  try {
    // First, check if the table exists and what columns it has
    console.log('📋 Step 1: Checking table structure...');
    const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!tableResponse.ok) {
      console.error('❌ Table check failed:', tableResponse.status, tableResponse.statusText);
      const errorText = await tableResponse.text();
      console.error('Error details:', errorText);
      return false;
    }
    
    const tableData = await tableResponse.json();
    console.log('✅ Table exists and is accessible');
    console.log('📊 Sample record structure:', Object.keys(tableData[0] || {}));
    
    // Test with minimal data (without email and name first)
    console.log('\n📋 Step 2: Testing minimal payment data...');
    const minimalPayment = {
      id: crypto.randomUUID(),
      user_id: 'debug-user-123',
      plan_name_payment: 'Debug Plan',
      original_price: 100,
      discount_amount: '0',
      final_price: 100,
      coupon_code: null,
      payment_method: 'debug',
      payment_status: 'completed',
      transaction_id: 'DEBUG-123456',
      payment_processor: 'Debug',
      crypto_transaction_hash: 'N/A',
      crypto_from_address: 'N/A',
      crypto_amount: '0'
    };
    
    console.log('📝 Minimal payment data:', minimalPayment);
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(minimalPayment)
    });
    
    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('❌ Minimal insert failed:', insertResponse.status, insertResponse.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const newPayment = await insertResponse.json();
    console.log('✅ Minimal payment SUCCESS!');
    console.log('📊 Payment details:', newPayment);
    
    // Test with email and name if columns exist
    console.log('\n📋 Step 3: Testing with email and name...');
    const paymentWithEmail = {
      ...minimalPayment,
      id: crypto.randomUUID(),
      user_email: 'debug@example.com',
      user_name: 'Debug User'
    };
    
    console.log('📝 Payment with email/name:', paymentWithEmail);
    
    const emailInsertResponse = await fetch(`${SUPABASE_URL}/rest/v1/payment%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(paymentWithEmail)
    });
    
    if (!emailInsertResponse.ok) {
      const errorText = await emailInsertResponse.text();
      console.error('❌ Email/name insert failed:', emailInsertResponse.status, emailInsertResponse.statusText);
      console.error('Error details:', errorText);
      console.log('💡 This means the email/name columns need to be added to the table');
    } else {
      const emailPayment = await emailInsertResponse.json();
      console.log('✅ Payment with email/name SUCCESS!');
      console.log('📊 Payment details:', emailPayment);
    }
    
    console.log('\n🎉 DEBUG COMPLETE!');
    console.log('✅ Basic payment integration is working');
    console.log('✅ Check your Supabase dashboard to see the test payments');
    
    return true;
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
    return false;
  }
}

// Run the debug
debugPaymentPage();
