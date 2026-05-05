/**
 * Local test script for the Election Status Cron endpoint.
 * This simulates a request to the /api/cron/election-status endpoint.
 */

import 'dotenv/config';

const DEPLOYMENT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

async function testCron() {
  console.log('🚀 Starting local cron test...');
  console.log(`📡 URL: ${DEPLOYMENT_URL}/api/cron/election-status`);
  
  if (!CRON_SECRET) {
    console.error('❌ Error: CRON_SECRET is not set in your .env file');
    process.exit(1);
  }

  try {
    const response = await fetch(`${DEPLOYMENT_URL}/api/cron/election-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'User-Agent': 'manual-test-script/1.0'
      }
    });

    const status = response.status;
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log('📊 Status:', status);
      console.log('📄 Response:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Failed!');
      console.log('📊 Status:', status);
      console.log('📄 Error Body:', JSON.stringify(data, null, 2));
      
      if (status === 401) {
        console.log('\n💡 Hint: Check if CRON_SECRET matches between your .env and the server.');
      }
    }
  } catch (error) {
    console.error('💥 Request failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Hint: Make sure your local server is running (npm run dev)');
    }
  }
}

testCron();
