import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { voterIds } = await request.json();

    if (!Array.isArray(voterIds) || voterIds.length === 0) {
      return NextResponse.json({ error: "Invalid voter IDs" }, { status: 400 });
    }

    // Validate that all IDs are numbers
    const validVoterIds = voterIds
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    if (validVoterIds.length !== voterIds.length) {
      return NextResponse.json({ error: "Invalid voter IDs" }, { status: 400 });
    }

    // Delete multiple voters
    const deleteResult = await prisma.voter.deleteMany({
      where: {
        id: {
          in: validVoterIds,
        },
      },
    });

    return NextResponse.json(
      { message: `${deleteResult.count} voter(s) deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting voters:", error);
    return NextResponse.json(
      {
        error: "Failed to delete voters",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
