// /app/api/elections/[electionId]/voters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { electionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Convert electionId to number
    const electionId = parseInt(params.electionId);
    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID" },
        { status: 400 }
      );
    }

    // Check if the election exists and the user has permission to view it
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
        // Based on your schema, the relation is through createdById
        createdById: parseInt(session.user.id),
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Fetch all voters for this election
    // Your Voter model has direct fields, not a user relation
    const voters = await prisma.voter.findMany({
      where: {
        electionId: electionId,
      },
      include: {
        year: true,
      },
      orderBy: {
        lastName: "asc",
      },
    });

    // Format the response according to your schema
    const formattedVoters = voters.map((voter) => ({
      id: voter.id,
      name: `${voter.lastName}, ${voter.firstName} ${voter.middleName}`,
      email: voter.email,
      department: "N/A", // You'll need to join with Department if needed
      year: voter.year?.name || "N/A",
      status: voter.status === "VOTED" ? "voted" : "not_voted",
      votedAt: voter.status === "VOTED" ? new Date().toLocaleString() : null, // You may need to find the vote timestamp
    }));

    return NextResponse.json(formattedVoters);
  } catch (error) {
    console.error("Error fetching voters:", error);
    return NextResponse.json(
      { error: "Failed to fetch voters" },
      { status: 500 }
    );
  }
}

// /app/api/elections/[electionId]/voters/[voterId]/route.ts
export async function DELETE(
  req: NextRequest,
  { params }: { params: { electionId: string; voterId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Convert electionId to number
    const electionId = parseInt(params.electionId);
    const voterId = parseInt(params.voterId);

    if (isNaN(electionId) || isNaN(voterId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if the election exists and the user has permission
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
        createdById: parseInt(session.user.id),
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Delete the voter
    await prisma.voter.delete({
      where: {
        id: voterId,
        electionId: electionId,
      },
    });

    return NextResponse.json({
      message: "Voter removed successfully",
    });
  } catch (error) {
    console.error("Error deleting voter:", error);
    return NextResponse.json(
      { error: "Failed to delete voter" },
      { status: 500 }
    );
  }
}
