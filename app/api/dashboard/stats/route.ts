import { NextResponse } from "next/server";
import { DashboardDataService } from "@/lib/data/dashboard";

export async function GET() {
  try {
    const stats = await DashboardDataService.getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
