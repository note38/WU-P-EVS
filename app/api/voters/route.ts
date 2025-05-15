// app/api/voters/route.ts
import { prisma } from "@/lib/db";
import { VoterStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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

    // Generate password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashpassword = await bcrypt.hash(tempPassword, 10);

    try {
      // Create voter
      const voter = await prisma.voter.create({
        data: {
          avatar: "default-avatar.png",
          firstName: String(data.firstName).trim(),
          lastName: String(data.lastName).trim(),
          middleName: data.middleName ? String(data.middleName).trim() : "",
          email: String(data.email).trim(),
          hashpassword,
          yearId: parseInt(data.yearId),
          status: "REGISTERED" as VoterStatus,
          credentialsSent: false,
          ...(data.electionId ? { electionId: parseInt(data.electionId) } : {}),
        },
      });

      console.log("Voter created:", voter); // Debug log

      return NextResponse.json(
        {
          success: true,
          message: "Voter created successfully",
          tempPassword,
        },
        { status: 201 }
      );
    } catch (err) {
      console.error("Database error:", err);
      return NextResponse.json(
        {
          error: "Database error",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      {
        error: "Invalid request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}
