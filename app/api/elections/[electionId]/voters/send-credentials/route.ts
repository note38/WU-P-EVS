import prisma from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { generatePassword } from "@/lib/utils";
import { VoterCredentialsEmail } from "@/app/emails/credentials-send";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: { electionId: string } }
) {
  try {
    const { electionId: electionIdStr } = params;
    const electionId = parseInt(electionIdStr);
    const body = await request.json();
    const { voterIds } = body;

    if (!voterIds || !Array.isArray(voterIds) || voterIds.length === 0) {
      return NextResponse.json(
        { error: "No voter IDs provided" },
        { status: 400 }
      );
    }

    // Validate that the election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Get voters that need credentials
    const voters = await prisma.voter.findMany({
      where: {
        id: { in: voterIds },
        electionId: electionId,
      },
      include: {
        year: {
          include: {
            department: true,
          },
        },
      },
    });

    if (voters.length === 0) {
      return NextResponse.json(
        { error: "No valid voters found" },
        { status: 404 }
      );
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each voter
    for (const voter of voters) {
      try {
        let password = "";
        let needsPasswordUpdate = false;

        // Check if voter needs a new password (if they don't have one or it's empty)
        if (!voter.hashpassword || voter.hashpassword.trim() === "") {
          password = generatePassword(12);
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(password, saltRounds);

          await prisma.voter.update({
            where: { id: voter.id },
            data: { hashpassword: hashedPassword },
          });
          needsPasswordUpdate = true;
        } else {
          // If voter already has a password, generate a new temporary one
          password = generatePassword(12);
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(password, saltRounds);

          await prisma.voter.update({
            where: { id: voter.id },
            data: { hashpassword: hashedPassword },
          });
        }

        // Prepare email data
        const emailData = {
          voterId: voter.id.toString(),
          firstName: voter.firstName,
          lastName: voter.lastName,
          middleName: voter.middleName || "",
          email: voter.email,
          password: password,
          electionName: election.name,
          departmentName: voter.year?.department?.name || "",
          yearName: voter.year?.name || "",
          loginLink: process.env.NEXT_PUBLIC_BASE_URL
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/login`
            : "http://localhost:3000/login",
        };

        // Check if email service is configured
        if (!resend) {
          failures.push({
            voterId: voter.id,
            error: "Email service not configured",
          });
          continue;
        }

        // Send email using the template
        const emailResult = await resend.emails.send({
          from:
            process.env.FROM_EMAIL || "WUP Voting System <noreply@wup-evs.com>",
          to: voter.email,
          subject: `Your Voting Credentials - ${election.name}`,
          react: VoterCredentialsEmail(emailData),
        });

        if (emailResult.error) {
          throw new Error(emailResult.error.message);
        }

        // Update voter to mark credentials as sent
        await prisma.voter.update({
          where: { id: voter.id },
          data: {
            credentialsSent: true,
            // Also update the last credentials sent timestamp if the field exists
          },
        });

        results.successful++;
      } catch (error) {
        console.error(`Error sending credentials to voter ${voter.id}:`, error);
        results.failed++;
        results.errors.push(
          `Failed to send to ${voter.firstName} ${voter.lastName} (${voter.email}): ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Return results
    return NextResponse.json({
      message: `Credentials sent to ${results.successful} voters`,
      count: results.successful,
      failed: results.failed,
      total: voters.length,
      ...(results.errors.length > 0 && { errors: results.errors }),
    });
  } catch (error) {
    console.error("Error in send credentials route:", error);
    return NextResponse.json(
      {
        error: "Failed to send credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
