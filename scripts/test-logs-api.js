// Simple script to test the logs API endpoints
const testLogsAPI = async () => {
  const endpoints = [
    "/api/logs/voters",
    "/api/logs/votes",
    "/api/logs/admin",
    "/api/logs/activity",
  ];

  console.log("Testing Logs API endpoints...\n");

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(`http://localhost:3000${endpoint}`);
      const data = await response.json();

      console.log(`  Status: ${response.status}`);
      console.log(`  Data items: ${data.data ? data.data.length : 0}`);
      console.log(`  Success: ${response.ok}\n`);
    } catch (error) {
      console.error(`  Error testing ${endpoint}:`, error.message);
    }
  }
};

// Run the test
testLogsAPI();
