// Test script to check API routes
const testApiRoutes = async () => {
  const routes = [
    "/api/dashboard/stats",
    "/api/dashboard/activities?limit=5",
    "/api/dashboard/voters?limit=5",
    "/api/logs/voters",
    "/api/logs/votes",
    "/api/logs/admin",
    "/api/logs/activity",
  ];

  console.log("Testing API routes...\n");

  for (const route of routes) {
    try {
      console.log(`Testing ${route}...`);
      const response = await fetch(`http://localhost:3000${route}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  OK: ${response.ok}`);

      if (!response.ok) {
        const text = await response.text();
        console.log(`  Response: ${text.substring(0, 100)}...`);
      }

      console.log("");
    } catch (error) {
      console.error(`  Error testing ${route}:`, error.message);
    }
  }
};

testApiRoutes();
