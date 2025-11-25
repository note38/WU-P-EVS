import { NextResponse } from "next/server";
import { DashboardDataService } from "@/lib/data/dashboard";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/clerk-auth";

export async function GET() {
  try {
    // Protect this route with authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify the user is an admin
    const userData = await getUserByClerkId(userId);
    if (!userData || userData.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
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