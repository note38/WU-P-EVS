const testVoterCreation = async () => {
  try {
    console.log("Testing direct voter creation without election...");

    // Use a fixed yearId that we know exists (from the seed data)
    // Don't include electionId to test creating a voter without an election
    const testData = {
      firstName: "NoElection",
      lastName: "Test",
      email: `noelection.test.${Date.now()}@example.com`,
      yearId: "4", // Using yearId 4 which should exist from seeding
      middleName: "API",
      // Don't include electionId
    };

    console.log("Sending test data:", testData);

    const response = await fetch("http://localhost:3000/api/voters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log("Response Status:", response.status);
    console.log(
      "Response Headers:",
      Object.fromEntries(response.headers.entries())
    );

    // Try to get response as text first to see what we're getting
    const responseText = await response.text();
    console.log(
      "Raw Response Text:",
      responseText.substring(0, 500) + (responseText.length > 500 ? "..." : "")
    );

    // Try to parse as JSON if it looks like JSON
    let responseData;
    if (
      responseText.trim().startsWith("{") ||
      responseText.trim().startsWith("[")
    ) {
      try {
        responseData = JSON.parse(responseText);
        console.log("Parsed Response Data:", responseData);
      } catch (parseError) {
        console.log("Failed to parse response as JSON:", parseError.message);
        responseData = {
          error: "Invalid JSON response",
          rawResponse: responseText,
        };
      }
    } else {
      responseData = { error: "Non-JSON response", rawResponse: responseText };
    }

    if (response.ok) {
      console.log("✅ Voter created successfully");
    } else {
      console.log("❌ Error creating voter");
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  }
};

testVoterCreation();
