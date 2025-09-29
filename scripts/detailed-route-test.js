// Detailed test of specific routes
async function testRoute(url) {
  try {
    console.log(`Testing: ${url}`);
    const response = await fetch(url);
    console.log(`  Status: ${response.status}`);
    console.log(`  Status Text: ${response.statusText}`);
    
    // Try to get response headers
    console.log(`  Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 404) {
      const text = await response.text();
      console.log(`  Response preview: ${text.substring(0, 200)}...`);
    } else if (response.ok) {
      const data = await response.json();
      console.log(`  Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`  First item keys: ${Object.keys(data[0]).join(', ')}`);
      }
    }
    
    console.log('');
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    console.log('');
  }
}

async function runTests() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('Testing dashboard routes:');
  await testRoute(`${baseUrl}/api/dashboard/stats`);
  await testRoute(`${baseUrl}/api/dashboard/activities?limit=3`);
  await testRoute(`${baseUrl}/api/dashboard/voters?limit=3`);
  
  console.log('Testing logs routes:');
  await testRoute(`${baseUrl}/api/logs/voters?limit=3`);
  await testRoute(`${baseUrl}/api/logs/activity?limit=3`);
}

runTests();