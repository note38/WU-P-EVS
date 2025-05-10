// app/api/voters/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields - election is no longer required
    if (!data.firstName || !data.lastName || !data.email || !data.yearId) {
      return NextResponse.json(
        {
          error: "Missing required fields",
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
        {
          error: "Email already registered",
        },
        { status: 409 }
      );
    }

    // Generate password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashpassword = await bcrypt.hash(tempPassword, 10);

    // Convert IDs to numbers
    const yearId = parseInt(data.yearId);

    // Create the base data object
    const voterData = {
      avatar: data.avatar || "default-avatar.png",
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName || "",
      email: data.email,
      hashpassword: hashpassword,
      electionId: "",
      yearId: yearId,
      status: "REGISTERED",
      credentialsSent: false,
    };

    // Add electionId only if it exists
    if (data.electionId) {
      Object.assign(voterData, { electionId: parseInt(data.electionId) });
    }

    try {
      // Create voter with relations
      const voter = await prisma.voter.create({
        data: voterData,
      });

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
    console.error("Request error:", error);
    return NextResponse.json(
      {
        error: "Invalid request",
      },
      { status: 400 }
    );
  }
}
