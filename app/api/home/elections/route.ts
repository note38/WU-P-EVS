import { NextResponse } from "next/server";
import { DashboardDataService } from "@/lib/data/dashboard";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    console.log("🏠 Home Elections API called with activeOnly:", activeOnly);

    if (activeOnly) {
      console.log("📊 Fetching active election for home page...");
      const activeElection = await DashboardDataService.getActiveElectionResults();
      
      if (activeElection) {
        console.log("✅ Active election found for home page");
        return NextResponse.json(activeElection, { status: 200 });
      }

      // If no active election, check for recent completed election within 24 hours
      console.log("🔍 No active election, checking for recent completed election...");
      const recentCompletedElection = await DashboardDataService.getRecentCompletedElectionResults();
      
      if (recentCompletedElection) {
        console.log("✅ Recent completed election found for home page");
        return NextResponse.json(recentCompletedElection, { status: 200 });
      }

      console.log("❌ No active or recent completed election found");
      return NextResponse.json(null, { status: 200 });
    } else {
      console.log("📊 Fetching all election results for home page...");
      const results = await DashboardDataService.getHomePageElectionResults();
      console.log("✅ Home page election results count:", results?.length || 0);

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
        error: "Failed to fetch home page election results",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}