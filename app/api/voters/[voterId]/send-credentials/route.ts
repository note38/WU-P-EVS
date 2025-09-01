import prisma from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { generatePassword } from "@/lib/utils";
import { VoterCredentialsEmail } from "@/app/emails/credentials-send";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: { voterId: string } }
) {
  try {
    const voterId = parseInt(params.voterId);

    if (isNaN(voterId)) {
      return NextResponse.json({ error: "Invalid voter ID" }, { status: 400 });
    }

    // Get the voter with related data
    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
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

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Check if voter is assigned to an election
    if (!voter.electionId || !voter.election) {
      return NextResponse.json(
        { error: "Voter is not assigned to any election" },
        { status: 400 }
      );
    }

    // Generate a new password
    const newPassword = generatePassword(12);
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update voter with new password
    await prisma.voter.update({
      where: { id: voterId },
      data: { hashpassword: hashedPassword },
    });

    // Prepare email data
    const emailData = {
      voterId: voter.id.toString(),
      firstName: voter.firstName,
      lastName: voter.lastName,
      middleName: voter.middleName || "",
      email: voter.email,
      password: newPassword,
      electionName: voter.election.name,
      departmentName: voter.year?.department?.name || "",
      yearName: voter.year?.name || "",
      loginLink: process.env.NEXT_PUBLIC_BASE_URL
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/login`
        : "http://localhost:3000/login",
    };

    // Check if email service is configured
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    // Send email using the template
    const emailResult = await resend.emails.send({
      from: process.env.FROM_EMAIL || "WUP Voting System <noreply@wup-evs.com>",
      to: voter.email,
      subject: `Your Voting Credentials - ${voter.election.name}`,
      react: VoterCredentialsEmail(emailData),
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message);
    }

    // Update voter to mark credentials as sent
    await prisma.voter.update({
      where: { id: voterId },
      data: { credentialsSent: true },
    });

    return NextResponse.json({
      message: "Credentials sent successfully",
      voter: {
        id: voter.id,
        firstName: voter.firstName,
        lastName: voter.lastName,
        email: voter.email,
      },
    });
  } catch (error) {
    console.error("Error sending credentials:", error);
    return NextResponse.json(
      {
        error: "Failed to send credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
