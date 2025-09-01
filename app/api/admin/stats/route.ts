import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get election stats
    const [totalElections, activeElections, completedElections, totalVoters] =
      await Promise.all([
        prisma.election.count(),
        prisma.election.count({
          where: { status: "ACTIVE" },
        }),
        prisma.election.count({
          where: { status: "COMPLETED" },
        }),
        prisma.voter.count(),
      ]);

    const stats = {
      totalElections,
      activeElections,
      completedElections,
      totalVoters,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Error fetching election stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
