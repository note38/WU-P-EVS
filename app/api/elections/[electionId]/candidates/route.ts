import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/elections/[electionId]/candidates
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

    // Fetch all candidates for this election with related data
    const candidates = await prisma.candidate.findMany({
      where: {
        electionId: electionId,
      },
      include: {
        position: true,
        partylist: true,
        year: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Format the response
    const formattedCandidates = candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      avatar: candidate.avatar || "/placeholder.svg",
      position: candidate.position.name,
      positionId: candidate.positionId,
      party: candidate.partylist.name,
      partylistId: candidate.partylistId,
      year: candidate.year?.name || "N/A",
      yearId: candidate.yearId,
      votes: 0, // You would need to count votes from the Vote table if needed
    }));

    return NextResponse.json(formattedCandidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

// POST /api/elections/[electionId]/candidates
export async function POST(
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

    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return NextResponse.json(
        { error: "Invalid request data: Could not parse JSON" },
        { status: 400 }
      );
    }

    // Validate required fields
    const { name, positionId, partylistId, voterId, avatar } = requestData;

    if (!name) {
      return NextResponse.json(
        { error: "Candidate name is required" },
        { status: 400 }
      );
    }

    if (!positionId) {
      return NextResponse.json(
        { error: "Position is required" },
        { status: 400 }
      );
    }

    if (!partylistId) {
      return NextResponse.json(
        { error: "Party/Affiliation is required" },
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

    // Check if the position exists
    const position = await prisma.position.findUnique({
      where: {
        id: parseInt(positionId),
        electionId,
      },
      include: {
        _count: {
          select: { candidates: true },
        },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    // Check if the position already has the maximum number of candidates
    if (position._count.candidates >= position.maxCandidates) {
      return NextResponse.json(
        {
          error: `This position already has the maximum number of candidates (${position.maxCandidates})`,
        },
        { status: 400 }
      );
    }

    // Check if the partylist exists
    let partyId = partylistId;

    // Handle the special case for 'independent' or -1 (special Independent ID)
    if (partylistId === "independent" || partylistId === "-1") {
      // Check if an Independent partylist already exists
      let independentPartylist = await prisma.partylist.findFirst({
        where: {
          name: { equals: "Independent", mode: "insensitive" },
          electionId,
        },
      });

      // Create the Independent partylist if it doesn't exist
      if (!independentPartylist) {
        independentPartylist = await prisma.partylist.create({
          data: {
            name: "Independent",
            electionId,
          },
        });
      }

      partyId = independentPartylist.id;
    } else {
      // For regular numeric party IDs, verify the partylist exists
      const partylist = await prisma.partylist.findUnique({
        where: {
          id: parseInt(partylistId),
          electionId,
        },
      });

      if (!partylist) {
        return NextResponse.json(
          { error: "Party/Affiliation not found" },
          { status: 404 }
        );
      }

      partyId = partylist.id;
    }

    // Get voter data if voterId is provided
    let yearId = null;
    if (voterId) {
      const voter = await prisma.voter.findUnique({
        where: {
          id: parseInt(voterId),
        },
      });

      if (!voter) {
        return NextResponse.json({ error: "Voter not found" }, { status: 404 });
      }

      yearId = voter.yearId;
    }

    // Create the candidate
    const candidate = await prisma.candidate.create({
      data: {
        name,
        avatar: avatar || "/placeholder.svg",
        positionId: parseInt(positionId),
        partylistId: typeof partyId === "string" ? parseInt(partyId) : partyId,
        electionId,
        yearId,
      },
    });

    return NextResponse.json(
      {
        message: "Candidate added successfully",
        candidate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating candidate:", error);
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  }
}
