/**
 * Test simple dashboard data insertion
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testSimpleDashboardInsert() {
  console.log('🧪 Testing Simple Dashboard Data Insertion...');
  console.log('='.repeat(50));
  
  try {
    // Simple dashboard data
    const simpleDashboardData = {
      id: crypto.randomUUID(),
      user_id: 'test-user-123',
      user_email: 'test@example.com',
      user_name: 'Test User',
      prop_firm: 'FTMO',
      account_type: 'Challenge',
      account_size: 10000.00,
      total_pnl: 500.00,
      win_rate: 60.0,
      total_trades: 10,
      selected_theme: 'concept1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Simple dashboard data:');
    console.log('  - User:', simpleDashboardData.user_name);
    console.log('  - Email:', simpleDashboardData.user_email);
    console.log('  - Prop Firm:', simpleDashboardData.prop_firm);
    console.log('  - Account Size: $', simpleDashboardData.account_size);
    console.log('  - Total PnL: $', simpleDashboardData.total_pnl);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user%20dashboard`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(simpleDashboardData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Insert failed:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return false;
    }
    
    const newDashboard = await response.json();
    console.log('✅ SUCCESS! Simple dashboard data saved to Supabase!');
    console.log('📊 Dashboard details:', {
      id: newDashboard.id,
      user_name: newDashboard.user_name,
      user_email: newDashboard.user_email,
      prop_firm: newDashboard.prop_firm,
      account_size: newDashboard.account_size,
      total_pnl: newDashboard.total_pnl
    });
    
    // Verify the dashboard was added
    console.log('\n🔍 Verifying dashboard was added...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/user%20dashboard?select=*&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const allDashboards = await verifyResponse.json();
      console.log(`✅ Verification successful! Found ${allDashboards.length} dashboards in table`);
      
      if (allDashboards.length > 0) {
        console.log('\n📊 Recent dashboards:');
        allDashboards.forEach((dashboard, index) => {
          console.log(`  ${index + 1}. ${dashboard.user_name} (${dashboard.user_email})`);
          console.log(`     - Prop Firm: ${dashboard.prop_firm || 'N/A'}`);
          console.log(`     - Account Size: $${dashboard.account_size || 'N/A'}`);
          console.log(`     - Total PnL: $${dashboard.total_pnl || 'N/A'}`);
          console.log(`     - Created: ${dashboard.created_at || 'N/A'}`);
          console.log('');
        });
      }
    }
    
    console.log('\n🎉 SIMPLE DASHBOARD INSERT TEST COMPLETE!');
    console.log('✅ Basic dashboard data insertion is working!');
    console.log('✅ The table is ready for your dashboard component!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testSimpleDashboardInsert();
