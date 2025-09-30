// Simple test to check if the API route is accessible
const testApiRoute = async () => {
  try {
    console.log("Testing API route accessibility...");

    // Test a simple GET request first
    const getResponse = await fetch("http://localhost:3000/api/voters");
    console.log("GET Response Status:", getResponse.status);

    let getData;
    try {
      getData = await getResponse.json();
      console.log("GET Response Data:", getData);
    } catch (e) {
      const text = await getResponse.text();
      console.log("GET Response Text:", text);
    }

    console.log("API route test completed");
  } catch (error) {
    console.error("API route test failed:", error);
  }
};

testApiRoute();
