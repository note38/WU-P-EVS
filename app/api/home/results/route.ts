import { NextResponse } from "next/server";
import { DashboardDataService } from "@/lib/data/dashboard";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    console.log("🔍 Home API called with activeOnly:", activeOnly);

    if (activeOnly) {
      console.log("📊 Fetching active election results...");
      const activeElection =
        await DashboardDataService.getActiveElectionResults();
      console.log(
        "✅ Active election results:",
        activeElection ? "Found" : "Not found"
      );

      // Always return 200 with the data (null if no active election)
      return NextResponse.json(activeElection, { status: 200 });
    } else {
      console.log("📊 Fetching all election results...");
      const results = await DashboardDataService.getElectionResults();
      console.log("✅ All election results count:", results?.length || 0);

      // Always return 200 with the data (empty array if no elections)
      return NextResponse.json(results || [], { status: 200 });
    }
  } catch (error) {
    console.error("❌ Error fetching home page election results:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch election results",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
