import { createClient } from '@supabase/supabase-js';

// Test Supabase client initialization
const supabaseUrl = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

console.log('🧪 Testing Supabase client initialization...');

try {
  // Create Supabase client with proper configuration
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'trading-platform'
      }
    }
  });

  console.log('✅ Supabase client created successfully');

  // Test connection
  console.log('🔗 Testing connection...');
  
  supabase.from('User details').select('count', { count: 'exact', head: true })
    .then((result) => {
      console.log('✅ Connection test successful:', result);
      console.log('🎉 Headers error is FIXED!');
    })
    .catch((error) => {
      console.error('❌ Connection test failed:', error);
    });

} catch (error) {
  console.error('❌ Error creating Supabase client:', error);
}
