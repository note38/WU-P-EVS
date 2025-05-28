import { NextResponse } from "next/server";
import { DashboardDataService } from "@/lib/data/dashboard";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    if (activeOnly) {
      const activeElection =
        await DashboardDataService.getActiveElectionResults();
      return NextResponse.json(activeElection);
    } else {
      const results = await DashboardDataService.getElectionResults();
      return NextResponse.json(results);
    }
  } catch (error) {
    console.error("Error fetching election results:", error);
    return NextResponse.json(
      { error: "Failed to fetch election results" },
      { status: 500 }
    );
  }
}
