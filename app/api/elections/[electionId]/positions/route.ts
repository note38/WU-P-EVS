import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/elections/[electionId]/positions
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ electionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params before accessing properties (Next.js 15 requirement)
    const params = await context.params;

    // Safely extract and parse the electionId from context params
    if (!params || !params.electionId) {
      return NextResponse.json(
        { error: "Missing election ID" },
        { status: 400 }
      );
    }

    const electionId = parseInt(params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID format" },
        { status: 400 }
      );
    }

    // Verify the election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Get all positions for this election with candidate count
    const positions = await prisma.position.findMany({
      where: { electionId },
      include: {
        _count: {
          select: { candidates: true },
        },
        year: {
          include: {
            department: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Format the response
    const formattedPositions = positions.map((position) => ({
      id: position.id,
      name: position.name,
      maxCandidates: position.maxCandidates,
      candidates: position._count.candidates,
      yearId: position.yearId,
      year: position.year
        ? {
            id: position.year.id,
            name: position.year.name,
            department: {
              id: position.year.department.id,
              name: position.year.department.name,
            },
          }
        : null,
    }));

    return NextResponse.json(formattedPositions);
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

// POST /api/elections/[electionId]/positions
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ electionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params before accessing properties (Next.js 15 requirement)
    const params = await context.params;

    // Safely extract and parse the electionId from context params
    if (!params || !params.electionId) {
      return NextResponse.json(
        { error: "Missing election ID" },
        { status: 400 }
      );
    }

    const electionId = parseInt(params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID format" },
        { status: 400 }
      );
    }

    // Then process the request body
    const { name, maxCandidates, yearId } = await req.json();

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Position name is required" },
        { status: 400 }
      );
    }

    if (!maxCandidates || maxCandidates < 1) {
      return NextResponse.json(
        { error: "Maximum candidates must be at least 1" },
        { status: 400 }
      );
    }

    // Verify the election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Create the position
    const position = await prisma.position.create({
      data: {
        name,
        maxCandidates,
        electionId,
        yearId: yearId || null, // Make yearId optional
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error("Error creating position:", error);
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}
