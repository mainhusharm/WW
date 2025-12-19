const axios = require('axios');

const BASE_URL = 'http://localhost:10002';

async function testService() {
  console.log('🧪 Testing YFinance Service...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test single price endpoint
    console.log('2. Testing single price endpoint...');
    const priceResponse = await axios.get(`${BASE_URL}/api/price/EUR/USD`);
    console.log('✅ Single price fetch passed:', priceResponse.data);
    console.log('');

    // Test bulk endpoint
    console.log('3. Testing bulk endpoint...');
    const bulkResponse = await axios.post(`${BASE_URL}/api/bulk`, {
      symbols: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
      timeframe: '1m',
      range: '1d'
    });
    console.log('✅ Bulk fetch passed:', bulkResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Service is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testService();
