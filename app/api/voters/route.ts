// app/api/voters/route.ts
import { prisma } from "@/lib/db";
import { generatePassword } from "@/lib/utils";
import { VoterStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // Temporarily disable auth for debugging
    // const { userId } = await auth();
    //
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const voters = await prisma.voter.findMany({
      include: {
        year: {
          include: {
            department: true,
          },
        },
        election: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: voters,
    });
  } catch (error) {
    console.error("Error fetching voters:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch voters",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("=== Starting voter creation ==="); // Debug log
    const data = await request.json();
    console.log("Received data:", data); // Debug log

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.yearId) {
      console.log("Missing required fields:", { data }); // Debug log
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            firstName: !data.firstName,
            lastName: !data.lastName,
            email: !data.email,
            yearId: !data.yearId,
          },
        },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingVoter = await prisma.voter.findUnique({
      where: { email: data.email },
    });

    if (existingVoter) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // For Clerk integration, we don't need to generate a password immediately
    // We'll only generate one if we need to send credentials via email
    let tempPassword = null;
    let hashpassword = null;

    try {
      console.log("Creating voter with data:", {
        firstName: String(data.firstName).trim(),
        lastName: String(data.lastName).trim(),
        middleName: data.middleName ? String(data.middleName).trim() : "",
        email: String(data.email).trim(),
        yearId: parseInt(data.yearId),
        // Handle electionId properly - only include if it's provided and not null/undefined
        ...(data.electionId && data.electionId !== "null"
          ? { electionId: parseInt(data.electionId) }
          : {}),
      }); // Debug log

      // Create voter
      const voter = await prisma.voter.create({
        data: {
          avatar: "default-avatar.png",
          firstName: String(data.firstName).trim(),
          lastName: String(data.lastName).trim(),
          middleName: data.middleName ? String(data.middleName).trim() : "",
          email: String(data.email).trim(),
          // Set hashpassword to null instead of empty string to properly respect the optional field
          hashpassword: hashpassword || null,
          yearId: parseInt(data.yearId),
          status: "UNCAST" as VoterStatus,
          // Handle electionId properly - only include if it's provided and not null/undefined
          ...(data.electionId &&
          data.electionId !== "null" &&
          data.electionId !== ""
            ? { electionId: parseInt(data.electionId) }
            : {}),
        },
        include: {
          year: {
            include: {
              department: true,
            },
          },
          election: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log("Voter created:", voter); // Debug log

      return NextResponse.json(
        {
          success: true,
          message: "Voter created successfully",
          voter: {
            id: voter.id,
            firstName: voter.firstName,
            lastName: voter.lastName,
            email: voter.email,
          },
        },
        { status: 201 }
      );
    } catch (err) {
      console.error("Database error:", err);
      // Return more detailed error information
      return NextResponse.json(
        {
          error: "Database error",
          details: err instanceof Error ? err.message : String(err),
          // Add stack trace in development for debugging
          ...(process.env.NODE_ENV === "development"
            ? { stack: err instanceof Error ? err.stack : undefined }
            : {}),
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Request parsing error:", error);
    // Handle different types of errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON",
          details: "Request body is not valid JSON",
        },
        { status: 400 }
      );
    }

    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Invalid request",
        details: error.message || "Unknown error occurred",
        // Add stack trace in development for debugging
        ...(process.env.NODE_ENV === "development"
          ? { stack: error.stack }
          : {}),
      },
      { status: 400 }
    );
  }
}