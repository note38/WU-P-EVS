/**
 * Script to manually trigger election status updates
 * Usage: node scripts/update-election-statuses.js
 */

async function updateElectionStatuses() {
  try {
    console.log("Starting manual election status update...");

    const response = await fetch(
      "http://localhost:3000/api/elections/auto-status-update",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Update completed successfully:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error("Update failed with status:", response.status);
      console.error("Error details:", errorData);
    }
  } catch (error) {
    console.error("Error triggering election status update:", error);
  }
}

// Run the function
updateElectionStatuses();
