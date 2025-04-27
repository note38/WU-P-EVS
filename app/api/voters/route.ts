// app/api/voters/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { generateVoterId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (
      !data.firstName ||
      !data.lastName ||
      !data.email ||
      !data.departmentId ||
      !data.electionId
    ) {
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

    // Generate voter ID
    const voterId = generateVoterId();

    // Convert IDs to numbers
    const departmentId = parseInt(data.departmentId);
    const electionId = parseInt(data.electionId);

    try {
      // Create voter with relations
      const voter = await prisma.voter.create({
        data: {
          voterId: voterId,
          avatar: "default-avatar.png",
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName || "",
          email: data.email,
          hashpassword: hashpassword,
          departmentId: departmentId,
          electionId: electionId,
          status: "REGISTERED",
          credentialsSent: false,
        },
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
