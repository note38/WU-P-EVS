// app/api/voters/route.ts
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { generatePassword } from "@/lib/utils";
import { VoterCredentialsEmail } from "@/app/emails/credentials-send";
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

    // Generate a secure password using the utility function
    const tempPassword = generatePassword(12);
    const hashpassword = await bcrypt.hash(tempPassword, 12);

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

      // If the voter is assigned to an election, automatically send credentials
      let credentialsSent = false;
      if (data.electionId && data.sendCredentials !== false && resend) {
        try {
          const emailData = {
            voterId: voter.id.toString(),
            firstName: voter.firstName,
            lastName: voter.lastName,
            middleName: voter.middleName || "",
            email: voter.email,
            password: tempPassword,
            electionName: voter.election?.name || "",
            departmentName: voter.year?.department?.name || "",
            yearName: voter.year?.name || "",
            loginLink: process.env.NEXT_PUBLIC_BASE_URL
              ? `${process.env.NEXT_PUBLIC_BASE_URL}/login`
              : "http://localhost:3000/login",
          };

          const emailResult = await resend.emails.send({
            from:
              process.env.FROM_EMAIL ||
              "WUP Voting System <noreply@wup-evs.com>",
            to: voter.email,
            subject: `Your Voting Credentials - ${voter.election?.name || "Election"}`,
            react: VoterCredentialsEmail(emailData),
          });

          if (!emailResult.error) {
            // Update voter to mark credentials as sent
            await prisma.voter.update({
              where: { id: voter.id },
              data: { credentialsSent: true },
            });
            credentialsSent = true;
          } else {
            console.error(
              "Error sending credentials email:",
              emailResult.error
            );
          }
        } catch (emailError) {
          console.error("Error sending credentials:", emailError);
          // Don't fail the voter creation if email fails
        }
      } else if (data.electionId && data.sendCredentials !== false && !resend) {
        console.warn(
          "Email service not configured - credentials not sent automatically"
        );
      }

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
          tempPassword: credentialsSent ? undefined : tempPassword, // Only return password if email wasn't sent
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
