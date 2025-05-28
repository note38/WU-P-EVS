import { NextResponse } from "next/server";
import { DashboardDataService } from "@/lib/data/dashboard";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const activities = await DashboardDataService.getRecentActivities(limit);
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activities" },
      { status: 500 }
    );
  }
}
