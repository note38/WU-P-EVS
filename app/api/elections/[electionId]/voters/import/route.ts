// /app/api/elections/[electionId]/voters/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role, VoterStatus } from "@prisma/client"; // Import the enums

export async function POST(
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

    // Parse the request body
    const body = await req.json();
    const { yearId } = body;

    // Validate yearId is provided
    if (!yearId) {
      return NextResponse.json(
        { error: "Year ID is required" },
        { status: 400 }
      );
    }

    // Convert IDs to numbers
    const electionId = parseInt(params.electionId);
    const yearIdNum = parseInt(yearId);

    if (isNaN(electionId) || isNaN(yearIdNum)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if the election exists and the user has permission to manage it
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

    // Since your schema doesn't have a concept of importing existing users,
    // you'll need to create new voters directly.
    // For demo purposes, we'll create a few sample voters
    // In a real app, you might import these from a CSV or another source.

    // Get the year info to use for creating voters
    const year = await prisma.year.findUnique({
      where: { id: yearIdNum },
      include: { department: true },
    });

    if (!year) {
      return NextResponse.json({ error: "Year not found" }, { status: 404 });
    }

    // Check for existing voters from this year in this election to avoid duplicates
    const existingVoterCount = await prisma.voter.count({
      where: {
        electionId: electionId,
        yearId: yearIdNum,
      },
    });

    if (existingVoterCount > 0) {
      return NextResponse.json(
        {
          message: `${existingVoterCount} voters from this year already exist in this election`,
        },
        { status: 200 }
      );
    }

    const sampleVoters = [
      {
        firstName: "John",
        lastName: "Doe",
        middleName: "A",
        email: `john.doe.${yearIdNum}@example.com`,
        avatar: "https://via.placeholder.com/150",
        hashpassword: await bcrypt.hash("password123", 10),
        yearId: yearIdNum,
        electionId: electionId,
        role: Role.VOTER, // Use the enum value instead of string
        status: VoterStatus.REGISTERED, // Use the enum value instead of string
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        middleName: "B",
        email: `jane.smith.${yearIdNum}@example.com`,
        avatar: "https://via.placeholder.com/150",
        hashpassword: await bcrypt.hash("password123", 10),
        yearId: yearIdNum,
        electionId: electionId,
        role: Role.VOTER, // Use the enum value instead of string
        status: VoterStatus.REGISTERED, // Use the enum value instead of string
      },
      // Add more sample voters as needed
    ];

    // Create the voters
    const result = await prisma.voter.createMany({
      data: sampleVoters,
      skipDuplicates: true, // Skip duplicates based on unique constraints
    });

    return NextResponse.json({
      message: "Voters imported successfully",
      count: result.count,
    });
  } catch (error) {
    console.error("Error importing voters:", error);
    return NextResponse.json(
      { error: "Failed to import voters" },
      { status: 500 }
    );
  }
}
