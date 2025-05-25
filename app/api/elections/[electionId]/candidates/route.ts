import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/elections/[electionId]/candidates
export async function GET(req: NextRequest, context: any) {
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

    // Get pagination and search parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "8");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

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

    // Build the where clause with search functionality
    const whereClause = {
      electionId: electionId,
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            position: {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }),
    };

    // Get total count for pagination
    const totalCandidates = await prisma.candidate.count({
      where: whereClause,
    });

    // Fetch candidates for this election with related data
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        position: true,
        partylist: true,
        year: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      skip: skip,
      take: limit,
    });

    // Get vote counts for each candidate
    const candidateIds = candidates.map((c) => c.id);
    const voteCounts = await prisma.vote.groupBy({
      by: ["candidateId"],
      where: {
        candidateId: { in: candidateIds },
        electionId: electionId,
      },
      _count: {
        candidateId: true,
      },
    });

    // Create a map of candidate ID to vote count
    const voteCountMap = voteCounts.reduce(
      (acc, vote) => {
        acc[vote.candidateId] = vote._count.candidateId;
        return acc;
      },
      {} as Record<number, number>
    );

    // Format the response
    const formattedCandidates = candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      avatar: candidate.avatar || "/placeholder.svg",
      position: candidate.position.name,
      positionId: candidate.positionId,
      party: candidate.partylist.name,
      partylistId: candidate.partylistId,
      year: candidate.year || null,
      yearId: candidate.yearId,
      votes: voteCountMap[candidate.id] || 0,
    }));

    return NextResponse.json({
      candidates: formattedCandidates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCandidates / limit),
        total: totalCandidates,
        hasMore: page < Math.ceil(totalCandidates / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

// POST /api/elections/[electionId]/candidates - using any type for context
export async function POST(req: NextRequest, context: any) {
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
