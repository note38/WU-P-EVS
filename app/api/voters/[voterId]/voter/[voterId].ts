// app/api/voters/route.ts
import { prisma } from "@/lib/db";
import { generatePassword } from "@/lib/utils";
import { resend } from "@/lib/resend";
import { VoterStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    // We'll only generate one if we need to send email credentials
    let tempPassword = null;
    let hashpassword = null;

    // Only generate password if we're going to send credentials via email
    const shouldSendCredentials =
      data.electionId && data.sendCredentials !== false && resend;
    if (shouldSendCredentials) {
      tempPassword = generatePassword(12);
      hashpassword = await bcrypt.hash(tempPassword, 12);
    }

    try {
      // Create voter
      const voter = await prisma.voter.create({
        data: {
          avatar: "default-avatar.png",
          firstName: String(data.firstName).trim(),
          lastName: String(data.lastName).trim(),
          middleName: data.middleName ? String(data.middleName).trim() : "",
          email: String(data.email).trim(),
          // Only store password hash if we generated one
          ...(hashpassword ? { hashpassword } : {}),
          yearId: parseInt(data.yearId),
          status: "UNCAST" as VoterStatus,
          ...(data.electionId ? { electionId: parseInt(data.electionId) } : {}),
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

      // Send credentials functionality has been disabled
      let credentialsSent = false;
      // Skip email sending since it's not needed

      return NextResponse.json(
        {
          success: true,
          message: "Voter created successfully",
          voter: {
            id: voter.id,
            firstName: voter.firstName,
            lastName: voter.lastName,
            email: voter.email,
            credentialsSent,
          },
          // Don't return tempPassword when using Clerk since voters will authenticate through Clerk
          // Only return password info if email wasn't sent and we're not using Clerk
          tempPassword:
            credentialsSent || !shouldSendCredentials
              ? undefined
              : "Voter will authenticate through Clerk",
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
