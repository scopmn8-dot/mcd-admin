// Test Google credentials parsing
const fs = require('fs');
const path = require('path');

// Test 1: Read from file (current working method)
console.log('=== Test 1: File-based credentials ===');
try {
  const CREDENTIALS_PATH = path.join(__dirname, 'backend', 'google-credentials.json');
  const fileCredentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  console.log('✅ File credentials loaded successfully');
  console.log('Client email:', fileCredentials.client_email);
  console.log('Private key starts with:', fileCredentials.private_key.substring(0, 50));
} catch (error) {
  console.error('❌ File credentials failed:', error.message);
}

// Test 2: Simulate environment variable parsing
console.log('\n=== Test 2: Environment variable simulation ===');
try {
  const CREDENTIALS_PATH = path.join(__dirname, 'backend', 'google-credentials.json');
  const fileCredentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  
  // Simulate what happens when we pass the private key through environment variables
  const privateKeyWithEscapes = fileCredentials.private_key.replace(/\n/g, '\\n');
  console.log('Private key with escapes (first 100 chars):', privateKeyWithEscapes.substring(0, 100));
  
  // Simulate parsing it back
  const parsedPrivateKey = privateKeyWithEscapes.replace(/\\n/g, '\n');
  const isValid = parsedPrivateKey === fileCredentials.private_key;
  console.log('✅ Escape/unescape test:', isValid ? 'PASSED' : 'FAILED');
  
  if (!isValid) {
    console.log('Original length:', fileCredentials.private_key.length);
    console.log('Parsed length:', parsedPrivateKey.length);
  }
} catch (error) {
  console.error('❌ Environment variable test failed:', error.message);
}

// Test 3: Check if credentials can create a JWT
console.log('\n=== Test 3: JWT Creation Test ===');
try {
  const { GoogleAuth } = require('google-auth-library');
  const CREDENTIALS_PATH = path.join(__dirname, 'backend', 'google-credentials.json');
  const fileCredentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  
  const auth = new GoogleAuth({
    credentials: fileCredentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  console.log('✅ GoogleAuth created successfully');
  
  // Try to get a client (this will validate the credentials)
  auth.getClient().then(() => {
    console.log('✅ Google Auth client validation: PASSED');
  }).catch(error => {
    console.error('❌ Google Auth client validation: FAILED', error.message);
  });
  
} catch (error) {
  console.error('❌ JWT creation test failed:', error.message);
}
