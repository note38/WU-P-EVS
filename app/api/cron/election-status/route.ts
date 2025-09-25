import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Election, ElectionStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Enhanced Security: Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const userAgent = request.headers.get("user-agent") || "";

    console.log("[CRON] Request received:", {
      userAgent,
      hasAuthHeader: !!authHeader,
      hasCronSecret: !!cronSecret,
      timestamp: new Date().toISOString(),
    });

    // Check if request comes from Vercel cron
    const isVercelCron =
      userAgent.includes("vercel-cron") || userAgent.includes("vercel");

    // Check if has valid secret token
    const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

    // Allow if either Vercel cron OR valid secret (for manual testing)
    if (!isVercelCron && !hasValidSecret) {
      console.log("[CRON] Unauthorized request:", {
        userAgent,
        expectedSecret: cronSecret ? "[REDACTED]" : "NOT_SET",
        providedAuth: authHeader ? "[REDACTED]" : "NONE",
        isVercelCron,
        hasValidSecret,
      });

      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "This endpoint requires Vercel cron user-agent or valid secret token",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Check if CRON_SECRET is configured
    if (!cronSecret) {
      console.error("[CRON] CRON_SECRET environment variable is not set");
      return NextResponse.json(
        {
          error: "Server Configuration Error",
          message: "CRON_SECRET environment variable is not configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    console.log(
      "[CRON] Authentication successful, proceeding with status update"
    );

    const now = new Date();
    console.log(
      `[CRON] Starting election status check at ${now.toISOString()}`
    );

    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error("[CRON] Database connection failed:", dbError);
      return NextResponse.json(
        {
          error: "Database Connection Error",
          message: "Failed to connect to the database",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Find elections that need status updates
    const electionsToUpdate = await prisma.election.findMany({
      where: {
        OR: [
          // Elections that should be ACTIVE (current time is between start and end, and status is INACTIVE)
          {
            status: "INACTIVE",
            startDate: { lte: now },
            endDate: { gt: now },
          },
          // Elections that should be COMPLETED (current time is past end date, and status is not COMPLETED)
          {
            status: { not: "COMPLETED" },
            endDate: { lte: now },
          },
        ],
      },
    });

    console.log(
      `[CRON] Found ${electionsToUpdate.length} elections needing updates`
    );

    if (electionsToUpdate.length === 0) {
      console.log("[CRON] No elections need status updates");
      return NextResponse.json({
        success: true,
        message: "No elections need status updates",
        timestamp: now.toISOString(),
        updatedCount: 0,
      });
    }

    const updatePromises = electionsToUpdate.map(async (election: Election) => {
      let newStatus: "ACTIVE" | "COMPLETED";

      if (now >= election.endDate) {
        newStatus = "COMPLETED";
      } else if (
        election.status === "INACTIVE" &&
        now >= election.startDate &&
        now < election.endDate
      ) {
        newStatus = "ACTIVE";
      } else {
        console.log(
          `[CRON] Skipping election "${election.name}" - no status change needed`
        );
        return null; // No update needed
      }

      console.log(
        `[CRON] Updating election "${election.name}" (ID: ${election.id}) from ${election.status} to ${newStatus}`
      );

      try {
        const updatedElection = await prisma.election.update({
          where: { id: election.id },
          data: {
            status: newStatus,
            updatedAt: now,
          },
        });

        console.log(
          `[CRON] Successfully updated election "${election.name}" to ${newStatus}`
        );
        return updatedElection;
      } catch (updateError) {
        console.error(
          `[CRON] Error updating election "${election.name}":`,
          updateError
        );
        return null;
      }
    });

    // Filter out null values and execute updates
    const validUpdates = updatePromises.filter(
      (
        promise: Promise<Election | null> | null
      ): promise is Promise<Election | null> => promise !== null
    );

    const updateResults = await Promise.all(validUpdates);
    const successfulUpdates = updateResults.filter(
      (election: Election | null): election is Election => election !== null
    );

    console.log(
      `[CRON] Successfully updated ${successfulUpdates.length} elections`
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${successfulUpdates.length} election(s)`,
      timestamp: now.toISOString(),
      updatedCount: successfulUpdates.length,
      updatedElections: successfulUpdates.map((election) => ({
        id: election.id,
        name: election.name,
        status: election.status,
      })),
    });
  } catch (error) {
    console.error("[CRON] Error in election status update:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update election statuses",
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering (with proper auth)
export async function POST(request: NextRequest) {
  try {
    // For POST requests, require additional authentication
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { 
          error: "Unauthorized",
          message: "This endpoint requires a valid CRON_SECRET token"
        }, 
        { status: 401 }
      );
    }

    // Reuse the same logic as GET
    return GET(request);
  } catch (error) {
    console.error("[CRON] Error in manual election status update:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to manually update election statuses",
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}