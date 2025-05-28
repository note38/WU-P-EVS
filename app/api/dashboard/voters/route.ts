import { NextResponse } from "next/server";
import { DashboardDataService } from "@/lib/data/dashboard";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const voters = await DashboardDataService.getRecentVoters(limit);
    return NextResponse.json(voters);
  } catch (error) {
    console.error("Error fetching recent voters:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent voters" },
      { status: 500 }
    );
  }
}
