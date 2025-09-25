import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check if prisma client is properly initialized
    if (!prisma) {
      return NextResponse.json(
        {
          error: "Database connection error",
          message: "Prisma client is not initialized",
          environment: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
        { status: 500 }
      );
    }

    // Test database connectivity
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
    } catch (dbError) {
      return NextResponse.json(
        {
          error: "Database connection failed",
          message:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
          environment: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
        { status: 500 }
      );
    }

    // Get table counts
    try {
      const [adminCount, voterCount, electionCount, voteCount] =
        await Promise.all([
          prisma.user.count(),
          prisma.voter.count(),
          prisma.election.count(),
          prisma.vote.count(),
        ]);

      return NextResponse.json({
        success: true,
        message: "Database connection successful",
        environment: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        stats: {
          adminUsers: adminCount,
          voters: voterCount,
          elections: electionCount,
          votes: voteCount,
        },
      });
    } catch (countError) {
      return NextResponse.json(
        {
          error: "Database query error",
          message:
            countError instanceof Error
              ? countError.message
              : "Failed to query database tables",
          environment: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in test-db endpoint:", error);
    return NextResponse.json(
      {
        error: "Unexpected error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        environment: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      },
      { status: 500 }
    );
  }
}
