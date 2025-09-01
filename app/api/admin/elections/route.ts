import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get elections data
    const elections = await prisma.election.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        partylists: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            positions: true,
            voters: true,
            votes: true,
          },
        },
        voters: {
          select: {
            status: true,
          },
        },
        positions: {
          select: {
            _count: {
              select: {
                candidates: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(elections);
  } catch (error) {
    console.error("❌ Error fetching elections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
