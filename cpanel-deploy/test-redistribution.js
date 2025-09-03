const http = require('http');

console.log('🔄 Testing job redistribution...');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/redistribute-jobs',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('\n🎯 REDISTRIBUTION RESULTS:');
      console.log('='.repeat(50));
      console.log('✅ Success:', result.success);
      console.log('📋 Message:', result.message);
      
      if (result.redistributions) {
        console.log('🔄 Jobs redistributed:', result.redistributions.length);
        console.log('👥 Initial drivers without jobs:', result.initialDriversWithoutJobs || 0);
        console.log('✅ Final drivers without jobs:', result.finalDriversWithoutJobs || 0);
        console.log('📈 Improvement:', result.improvement || 0, 'drivers now have jobs');
        
        if (result.redistributions.length > 0) {
          console.log('\n🔄 REDISTRIBUTION DETAILS:');
          result.redistributions.slice(0, 5).forEach((r, i) => {
            console.log(`  ${i+1}. Job ${r.job_id}: ${r.from_driver} → ${r.to_driver}`);
            console.log(`     Customer: ${r.customer_name}`);
          });
          
          if (result.redistributions.length > 5) {
            console.log(`   ... and ${result.redistributions.length - 5} more redistributions`);
          }
        }
      }
      
      if (result.finalDriversWithoutJobs === 0) {
        console.log('\n🎉 SUCCESS! All drivers now have at least one job!');
      } else {
        console.log(`\n⚠️  Still need to address ${result.finalDriversWithoutJobs} drivers without jobs`);
      }
      
    } catch (e) {
      console.log('❌ Error parsing response:', e.message);
      console.log('Raw response (first 500 chars):', responseData.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.end();
