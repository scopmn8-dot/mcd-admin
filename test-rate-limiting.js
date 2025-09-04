// Test script to check rate limiting status
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001'; // Test local backend with rate limiting

async function testRateLimitStatus() {
  try {
    console.log('🔍 Checking rate limiting status...\n');
    
    const response = await axios.get(`${BACKEND_URL}/api/rate-limit-status`);
    const status = response.data;
    
    console.log('📊 Rate Limiting Status:');
    console.log(`   API Calls Made: ${status.apiCallCount}/${status.maxCalls}`);
    console.log(`   Remaining Calls: ${status.remainingCalls}`);
    console.log(`   Time Until Reset: ${status.timeUntilReset}s`);
    console.log(`   Cache Age: ${status.cacheAge}s`);
    console.log(`   Cache TTL: ${status.cacheTTL}s`);
    console.log(`   Cache Valid: ${status.cacheValid ? '✅' : '❌'}`);
    
    if (status.remainingCalls < 10) {
      console.log('\n⚠️  WARNING: Low remaining API calls!');
    }
    
    if (status.cacheValid) {
      console.log('\n✅ Cache is valid, API calls will be minimized');
    } else {
      console.log('\n🔄 Cache is invalid, fresh data will be fetched');
    }
    
  } catch (error) {
    console.log('💡 Rate limiting status endpoint not yet deployed (expected on local test)');
    console.log('   Testing with production backend at:', BACKEND_URL === 'http://localhost:3001' ? 'LOCAL' : 'PRODUCTION');
  }
}

async function testDataFetch() {
  try {
    console.log('\n🔍 Testing data fetch (this should use cache if valid)...\n');
    
    const response = await axios.get(`${BACKEND_URL}/api/motorway`);
    console.log(`✅ Successfully fetched ${response.data.length} motorway jobs`);
    
    // Check status again after fetch
    await testRateLimitStatus();
    
  } catch (error) {
    console.error('❌ Error fetching data:', error.response?.data || error.message);
  }
}

async function runTest() {
  await testRateLimitStatus();
  await testDataFetch();
}

runTest();
