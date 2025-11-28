import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/clerk-auth";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the voter information
    const user = await getUserByClerkId(userId);

    // Check if user is a voter and has an election assigned
    if (!user || user.type !== "voter") {
      return NextResponse.json(
        { error: "User is not a voter" },
        { status: 400 }
      );
    }

    // @ts-ignore: TypeScript doesn't recognize the dynamic structure correctly
    const voter = user.user;

    // @ts-ignore: TypeScript doesn't recognize the dynamic structure correctly
    if (!voter.election) {
      return NextResponse.json(
        { error: "Voter not assigned to an election" },
        { status: 400 }
      );
    }

    // Get the active election assigned to this voter
    // @ts-ignore: TypeScript doesn't recognize the dynamic structure correctly
    const election = await prisma.election.findUnique({
      where: {
        // @ts-ignore: TypeScript doesn't recognize the dynamic structure correctly
        id: voter.election.id,
        status: "ACTIVE",
      },
      include: {
        positions: {
          include: {
            candidates: {
              include: {
                partylist: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "No active election found for this voter" },
        { status: 404 }
      );
    }

    // Format positions with candidates
    const positions = election.positions.map((position) => ({
      id: String(position.id),
      title: position.name,
      candidates: position.candidates.map((candidate) => ({
        id: String(candidate.id),
        name: candidate.name,
        party: candidate.partylist?.name || "Independent",
        avatar: candidate.avatar || undefined,
      })),
    }));

    // Return election data and positions
    return NextResponse.json({
      election: {
        id: String(election.id),
        name: election.name,
        description: election.description,
      },
      positions,
    });
  } catch (error) {
    console.error("Error fetching active election:", error);
    return NextResponse.json(
      { error: "Failed to fetch active election" },
      { status: 500 }
    );
  }
}
