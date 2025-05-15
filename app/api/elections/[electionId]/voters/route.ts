import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/elections/[electionId]/voters
export async function GET(
  req: NextRequest,
  context: { params: { electionId: string } }
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

    // Safely extract and parse the electionId from context params
    if (!context.params || !context.params.electionId) {
      return NextResponse.json(
        { error: "Missing election ID" },
        { status: 400 }
      );
    }

    // Convert electionId to number
    const electionId = parseInt(context.params.electionId);
    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID" },
        { status: 400 }
      );
    }

    // Check if the election exists
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

    // Fetch voters with their department and year information
    const voters = await prisma.voter.findMany({
      where: {
        // Either get voters assigned to this election, or unassigned voters
        OR: [{ electionId: electionId }, { electionId: null }],
      },
      include: {
        year: {
          include: {
            department: true, // Include department information
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    // Format the voters for the frontend
    const formattedVoters = voters.map((voter) => ({
      id: voter.id,
      firstName: voter.firstName,
      lastName: voter.lastName,
      middleName: voter.middleName,
      email: voter.email,
      avatar: voter.avatar,
      status: voter.status,
      yearId: voter.yearId,
      year: voter.year
        ? {
            id: voter.year.id,
            name: voter.year.name,
          }
        : null,
      department: voter.year?.department
        ? {
            id: voter.year.department.id,
            name: voter.year.department.name,
          }
        : null,
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
