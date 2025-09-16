/**
 * Check if user dashboard table exists
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function checkDashboardTable() {
  console.log('🔍 Checking if user dashboard table exists...');
  console.log('='.repeat(50));
  
  try {
    // Try to query the table
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user%20dashboard?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! User dashboard table exists!');
      console.log(`📊 Found ${data.length} records in the table`);
      
      if (data.length > 0) {
        console.log('📝 Sample record:', {
          id: data[0].id,
          user_name: data[0].user_name,
          user_email: data[0].user_email,
          prop_firm: data[0].prop_firm,
          total_pnl: data[0].total_pnl
        });
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Table does not exist or has issues:', response.status, response.statusText);
      console.error('Error details:', errorText);
      
      if (errorText.includes('Could not find the table')) {
        console.log('\n💡 SOLUTION: Create the user dashboard table');
        console.log('Run this SQL in your Supabase SQL editor:');
        console.log('');
        console.log('CREATE TABLE "user dashboard" (');
        console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
        console.log('  user_id TEXT NOT NULL,');
        console.log('  user_email TEXT NOT NULL,');
        console.log('  user_name TEXT NOT NULL,');
        console.log('  prop_firm TEXT,');
        console.log('  account_type TEXT,');
        console.log('  account_size DECIMAL(12,2),');
        console.log('  total_pnl DECIMAL(12,2) DEFAULT 0,');
        console.log('  win_rate DECIMAL(5,2) DEFAULT 0,');
        console.log('  total_trades INTEGER DEFAULT 0,');
        console.log('  selected_theme TEXT DEFAULT \'concept1\',');
        console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
        console.log('');
        console.log('ALTER TABLE "user dashboard" DISABLE ROW LEVEL SECURITY;');
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking table:', error);
    return false;
  }
}

// Run the check
checkDashboardTable();
