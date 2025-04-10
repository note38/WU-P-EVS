// app/actions/voter.ts
"use server";

import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { Resend } from "resend";
import { generatePassword, generateVoterId } from "@/lib/utils";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY); // Note: don't use NEXT_PUBLIC_ prefix for server-side env vars

interface CreateVoterData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  departmentId: string;
  electionId: string;
  avatarUrl: string;
}

export async function createVoter(data: CreateVoterData) {
  try {
    // Generate voter ID
    const voterId = generateVoterId();

    // Generate a random password
    const plainPassword = generatePassword();

    // Hash the password before storing
    const saltRounds = 10;
    const hashpassword = await bcryptjs.hash(plainPassword, saltRounds);

    // Create voter in database
    const newVoter = await prisma.voter.create({
      data: {
        voterId,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        email: data.email,
        hashpassword,
        avatar: data.avatarUrl,
        election: { connect: { id: parseInt(data.electionId) } },
        department: { connect: { id: parseInt(data.departmentId) } },
        status: "REGISTERED",
        credentialsSent: false,
      },
    });

    // Send email with credentials
    await sendCredentialsEmail(data.email, voterId, plainPassword);

    // Update voter to mark credentials as sent
    await prisma.voter.update({
      where: { id: newVoter.id },
      data: { credentialsSent: true },
    });

    return { success: true, voterId };
  } catch (error) {
    console.error("Error creating voter:", error);
    return { success: false, error: (error as Error).message };
  }
}

async function sendCredentialsEmail(
  email: string,
  voterId: string,
  password: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Voting System <noreply@yourdomain.com>",
      to: email,
      subject: "Your Voting Credentials",
      html: `
        <h1>Welcome to the Voting System</h1>
        <p>Your account has been created. Here are your login credentials:</p>
        <p><strong>Voter ID:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please keep this information secure and don't share it with anyone.</p>
        <p>You can login at: <a href="https://yourdomain.com/login">https://yourdomain.com/login</a></p>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
