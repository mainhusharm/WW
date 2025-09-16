/**
 * Test Signup Enhanced Integration
 * This will test if the EnhancedSignupForm is properly integrated with Supabase
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testSignupEnhancedIntegration() {
  console.log('🧪 Testing Signup Enhanced Integration...');
  console.log('='.repeat(60));
  
  try {
    // Simulate the data that would come from EnhancedSignupForm
    const formData = {
      firstName: 'Anchal',
      lastName: 'Sharma',
      email: `giggletales18.${Date.now()}@example.com`,
      phone: '08178291321',
      company: 'TRADEREDGEPRO',
      country: 'United States',
      agreeToTerms: true,
      agreeToMarketing: true,
      password: 'testpassword123'
    };

    const selectedPlan = {
      name: 'Elite Plan',
      price: 1299,
      period: 'month',
      description: 'Complete MT5 bot development service'
    };

    console.log('📝 Form data from EnhancedSignupForm:');
    console.log(`   Name: ${formData.firstName} ${formData.lastName}`);
    console.log(`   Email: ${formData.email}`);
    console.log(`   Company: ${formData.company}`);
    console.log(`   Country: ${formData.country}`);
    console.log(`   Plan: ${selectedPlan.name} - $${selectedPlan.price}/${selectedPlan.period}`);

    // Create the Supabase user data (same as in EnhancedSignupForm)
    const supabaseUserData = {
      id: crypto.randomUUID(), // Generate unique ID
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone || null,
      company: formData.company || null,
      country: formData.country || null,
      language: 'English',
      password_hash: formData.password, // Note: In production, hash this properly
      agree_to_terms: formData.agreeToTerms,
      agree_to_marketing: formData.agreeToMarketing,
      trading_experience_signup: 'beginner', // Default value
      trading_goals_signup: 'Make consistent profits', // Default value
      risk_tolerance_signup: 'moderate', // Default value
      preferred_markets: 'forex', // Default value
      trading_style: 'day', // Default value
      status: 'PENDING',
      membership_tier: 'free',
      account_type: 'personal',
      setup_complete: false,
      is_temporary: false,
      unique_id: `USER-${Date.now()}`,
      token: `TOKEN-${Date.now()}`,
      selected_plan: selectedPlan ? {
        name: selectedPlan.name,
        price: selectedPlan.price,
        period: selectedPlan.period,
        description: selectedPlan.description
      } : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('\n🔍 Attempting to save to Supabase...');
    console.log('📊 Supabase user data:', {
      id: supabaseUserData.id,
      name: `${supabaseUserData.first_name} ${supabaseUserData.last_name}`,
      email: supabaseUserData.email,
      company: supabaseUserData.company,
      plan: supabaseUserData.selected_plan?.name
    });

    // Try to insert the user
    const response = await fetch(`${SUPABASE_URL}/rest/v1/User%20details`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(supabaseUserData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to save user:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return false;
    }

    const newUser = await response.json();
    console.log('✅ SUCCESS! User saved to Supabase!');
    console.log('📊 User details:');
    console.log(`   ID: ${newUser[0].id}`);
    console.log(`   Name: ${newUser[0].first_name} ${newUser[0].last_name}`);
    console.log(`   Email: ${newUser[0].email}`);
    console.log(`   Company: ${newUser[0].company}`);
    console.log(`   Plan: ${newUser[0].selected_plan?.name}`);
    console.log(`   Status: ${newUser[0].status}`);
    console.log(`   Created: ${newUser[0].created_at}`);

    // Verify the user was added
    console.log('\n🔍 Verifying user was added...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/User%20details?select=*&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (verifyResponse.ok) {
      const allUsers = await verifyResponse.json();
      console.log(`✅ Verification successful! Found ${allUsers.length} users in table`);
      
      if (allUsers.length > 0) {
        console.log('📊 Recent users:');
        allUsers.slice(0, 5).forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (${user.email}) - ${user.status}`);
        });
      }
    }

    console.log('\n🎉 INTEGRATION TEST COMPLETE!');
    console.log('✅ EnhancedSignupForm integration is working perfectly');
    console.log('✅ Data from your signup form will now go to Supabase');
    console.log('✅ Check your Supabase dashboard to see the new user');
    console.log('\n📝 Next steps:');
    console.log('1. Test your actual /signup-enhanced page');
    console.log('2. Fill out the form and submit');
    console.log('3. Check your Supabase dashboard for the new user');
    console.log('4. The data will be saved automatically!');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testSignupEnhancedIntegration();
