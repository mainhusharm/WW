// Test script to verify API endpoints are working
const API_BASE = 'https://backend-u4hy.onrender.com/api';

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  const endpoints = [
    { name: 'Prop Firm Rules', url: `${API_BASE}/prop-firm/rules?accountType=QuantTekel%20Instant` },
    { name: 'Signals Dashboard', url: `${API_BASE}/signals/dashboard?type=all&limit=5` },
    { name: 'Forex News', url: `${API_BASE}/news/forex-factory?currency=ALL` },
    { name: 'Customer Dashboard', url: `${API_BASE}/customers/dashboard` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await fetch(endpoint.url);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Data keys: ${Object.keys(data).join(', ')}`);
      } else {
        console.log(`❌ ${endpoint.name}: FAILED`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR`);
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }
}

// Run the test
testAPIEndpoints().catch(console.error);
