const testVoterCreation = async () => {
  try {
    // First, let's get a valid yearId from the database
    console.log("Fetching years...");
    const yearsResponse = await fetch("http://localhost:3000/api/years");
    console.log("Years response status:", yearsResponse.status);

    if (!yearsResponse.ok) {
      console.log("Failed to fetch years. Status:", yearsResponse.status);
      const errorText = await yearsResponse.text();
      console.log("Error text:", errorText);
      return;
    }

    const yearsData = await yearsResponse.json();
    const yearId = yearsData[0]?.id || 1;

    console.log("Using yearId:", yearId);

    // Test data for voter creation
    const testData = {
      firstName: "Test",
      lastName: "Voter",
      email: `test.voter.${Date.now()}@example.com`,
      yearId: yearId.toString(),
      middleName: "Middle",
      electionId: null,
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
