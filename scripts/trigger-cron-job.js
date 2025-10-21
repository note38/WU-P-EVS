/**
 * Script to manually trigger the election status cron job
 */

async function triggerCronJob() {
  try {
    console.log("=== Triggering Election Status Cron Job ===");

    // Get the CRON_SECRET from environment
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET environment variable is not set");
      process.exit(1);
    }

    // Trigger the cron job endpoint
    const response = await fetch(
      "http://localhost:3000/api/cron/election-status",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          "User-Agent": "vercel-cron", // This might help bypass the user agent check
        },
      }
    );

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    // Try to parse the response
    let data;
    try {
      data = await response.json();
      console.log("Response data:", JSON.stringify(data, null, 2));
    } catch (parseError) {
      const text = await response.text();
      console.log("Response text:", text);
    }

    if (response.ok) {
      console.log("✅ Cron job triggered successfully");
    } else {
      console.log("❌ Cron job failed");
    }
  } catch (error) {
    console.error("Error triggering cron job:", error);
  }
}

// Run the function
triggerCronJob();
