const axios = require('axios');

const BASE_URL = 'http://localhost:10003';

// Test configuration
const TEST_SYMBOLS = ['S&P 500', 'Nasdaq-100', 'Crude Oil', 'Gold', 'Euro FX'];
const TEST_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', response.data.status);
    console.log(`📊 Supported Assets: ${response.data.supportedAssets.length}`);
    console.log(`⏰ Timeframes: ${response.data.timeframes.join(', ')}`);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testSymbolsEndpoint() {
  console.log('\n🔍 Testing Symbols Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/api/symbols`);
    console.log('✅ Symbols Retrieved:', response.data.count);
    console.log('📋 Available Symbols:');
    Object.entries(response.data.symbols).forEach(([name, symbol]) => {
      console.log(`   ${name}: ${symbol}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Symbols Test Failed:', error.message);
    return false;
  }
}

async function testSinglePrice(symbol, timeframe = '1m') {
  console.log(`\n🔍 Testing Single Price: ${symbol} (${timeframe})...`);
  try {
    const response = await axios.get(`${BASE_URL}/api/price/${encodeURIComponent(symbol)}?timeframe=${timeframe}&range=1d`);
    const data = response.data;
    
    console.log(`✅ ${data.name} (${data.symbol})`);
    console.log(`   Price: $${data.price}`);
    console.log(`   Change: ${data.change > 0 ? '+' : ''}${data.change.toFixed(2)} (${data.changePercent.toFixed(2)}%)`);
    console.log(`   Volume: ${data.volume}`);
    console.log(`   Market: ${data.marketState}`);
    console.log(`   Category: ${data.category}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Single Price Test Failed for ${symbol}:`, error.message);
    return false;
  }
}

async function testBulkPrices(symbols, timeframe = '1m') {
  console.log(`\n🔍 Testing Bulk Prices: ${symbols.length} symbols (${timeframe})...`);
  try {
    const response = await axios.post(`${BASE_URL}/api/bulk`, {
      symbols: symbols,
      timeframe: timeframe,
      range: '1d'
    });
    
    const data = response.data;
    console.log(`✅ Bulk Fetch: ${data.count}/${data.total} successful`);
    
    data.data.forEach(item => {
      console.log(`   ${item.name}: $${item.price} (${item.changePercent.toFixed(2)}%)`);
    });
    
    if (data.errors.length > 0) {
      console.log('⚠️  Errors:');
      data.errors.forEach(error => {
        console.log(`   ${error.symbol}: ${error.error}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Bulk Prices Test Failed:', error.message);
    return false;
  }
}

async function testHistoricalData(symbol, timeframe = '1h') {
  console.log(`\n🔍 Testing Historical Data: ${symbol} (${timeframe})...`);
  try {
    const response = await axios.get(`${BASE_URL}/api/historical/${encodeURIComponent(symbol)}?timeframe=${timeframe}&range=5d`);
    const data = response.data;
    
    console.log(`✅ Historical Data for ${data.name}`);
    console.log(`   Bars: ${data.count}`);
    console.log(`   Timeframe: ${data.timeframe}`);
    console.log(`   Range: ${data.range}`);
    
    if (data.data.length > 0) {
      const latest = data.data[data.data.length - 1];
      console.log(`   Latest: O:${latest.open} H:${latest.high} L:${latest.low} C:${latest.close}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Historical Data Test Failed for ${symbol}:`, error.message);
    return false;
  }
}

async function testCategoryEndpoint(category) {
  console.log(`\n🔍 Testing Category: ${category}...`);
  try {
    const response = await axios.get(`${BASE_URL}/api/category/${category}?timeframe=1m`);
    const data = response.data;
    
    console.log(`✅ Category ${category}: ${data.count} assets`);
    data.data.forEach(item => {
      console.log(`   ${item.name}: $${item.price} (${item.changePercent.toFixed(2)}%)`);
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Category Test Failed for ${category}:`, error.message);
    return false;
  }
}

async function testAllTimeframes(symbol) {
  console.log(`\n🔍 Testing All Timeframes for ${symbol}...`);
  let successCount = 0;
  
  for (const timeframe of TEST_TIMEFRAMES) {
    try {
      const response = await axios.get(`${BASE_URL}/api/price/${encodeURIComponent(symbol)}?timeframe=${timeframe}&range=1d`);
      console.log(`   ✅ ${timeframe}: $${response.data.price}`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ ${timeframe}: ${error.message}`);
    }
  }
  
  console.log(`📊 Timeframe Success Rate: ${successCount}/${TEST_TIMEFRAMES.length}`);
  return successCount === TEST_TIMEFRAMES.length;
}

async function runAllTests() {
  console.log('🚀 Starting Futures Data Service Tests...');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // Basic functionality tests
  results.push(await testHealthCheck());
  results.push(await testSymbolsEndpoint());
  
  // Price data tests
  for (const symbol of TEST_SYMBOLS) {
    results.push(await testSinglePrice(symbol));
  }
  
  // Bulk test
  results.push(await testBulkPrices(TEST_SYMBOLS));
  
  // Historical data test
  results.push(await testHistoricalData('S&P 500'));
  
  // Category tests
  const categories = ['indices', 'commodities', 'treasuries', 'currencies'];
  for (const category of categories) {
    results.push(await testCategoryEndpoint(category));
  }
  
  // Timeframe test
  results.push(await testAllTimeframes('Gold'));
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Futures service is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n🔗 Service Endpoints:');
  console.log(`   Health: ${BASE_URL}/health`);
  console.log(`   Symbols: ${BASE_URL}/api/symbols`);
  console.log(`   Price: ${BASE_URL}/api/price/:symbol`);
  console.log(`   Bulk: ${BASE_URL}/api/bulk (POST)`);
  console.log(`   Historical: ${BASE_URL}/api/historical/:symbol`);
  console.log(`   Category: ${BASE_URL}/api/category/:category`);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testSymbolsEndpoint,
  testSinglePrice,
  testBulkPrices,
  testHistoricalData,
  testCategoryEndpoint,
  testAllTimeframes,
  runAllTests
};
