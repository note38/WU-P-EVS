import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/elections/[electionId]/partylists
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

    // Check if the election exists
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Fetch all partylists for this election
    const partylists = await prisma.partylist.findMany({
      where: {
        electionId: electionId,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Add Independent option if it doesn't exist
    const hasIndependent = partylists.some(
      (p) => p.name.toLowerCase() === "independent"
    );

    // Convert the result to a plain array that we can modify
    const formattedPartylists = partylists.map((partylist) => ({
      ...partylist,
      id: partylist.id,
    }));

    if (!hasIndependent) {
      formattedPartylists.push({
        id: -1, // Use a special ID for Independent that won't conflict with DB IDs
        name: "Independent",
        electionId: electionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json(formattedPartylists);
  } catch (error) {
    console.error("Error fetching partylists:", error);
    return NextResponse.json(
      { error: "Failed to fetch partylists" },
      { status: 500 }
    );
  }
}

// POST /api/elections/[electionId]/partylists
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

    // Parse request body
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

    const { name } = requestData;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Party name is required" },
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

    // Check if partylist with same name already exists
    const existingPartylist = await prisma.partylist.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        electionId,
      },
    });

    if (existingPartylist) {
      return NextResponse.json(
        { error: "A party with this name already exists" },
        { status: 409 }
      );
    }

    // Create the partylist
    const partylist = await prisma.partylist.create({
      data: {
        name,
        electionId,
      },
    });

    return NextResponse.json(
      { message: "Party created successfully", partylist },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating partylist:", error);
    return NextResponse.json(
      { error: "Failed to create party" },
      { status: 500 }
    );
  }
}
