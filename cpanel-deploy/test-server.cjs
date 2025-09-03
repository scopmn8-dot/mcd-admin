const http = require('http');

console.log('🏁 Simple server test...');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/drivers',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(responseData);
        console.log('✅ Server is responding! Driver count:', result.length);
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    } else {
      console.log('HTTP Error:', res.statusCode);
      console.log('Response:', responseData.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Connection error:', e.message);
  console.error('Make sure the server is running on port 4000');
});

req.setTimeout(5000, () => {
  console.error('❌ Request timeout');
  req.destroy();
});

req.end();
