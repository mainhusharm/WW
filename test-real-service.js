// Test script for realYfinanceService
import('./src/services/realYfinanceService.ts').then(async (module) => {
  const realYfinanceService = module.default;
  
  console.log('🧪 Testing realYfinanceService...');
  
  try {
    // Test single price fetch
    console.log('\n📊 Testing single price fetch for EUR/USD...');
    const priceData = await realYfinanceService.fetchRealPrice('EUR/USD');
    console.log('Result:', priceData);
    
    // Test bulk price fetch
    console.log('\n📊 Testing bulk price fetch...');
    const bulkData = await realYfinanceService.fetchBulkRealPrices(['EUR/USD', 'GBP/USD']);
    console.log('Result:', bulkData);
    
    // Test historical data
    console.log('\n📊 Testing historical data fetch...');
    const historicalData = await realYfinanceService.fetchRealHistoricalData('EUR/USD', '1m', '1d');
    console.log('Result:', historicalData ? `${historicalData.length} bars` : 'No data');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}).catch(error => {
  console.error('❌ Failed to import service:', error);
});
