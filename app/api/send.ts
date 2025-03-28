import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailTemplate } from "../components/email_template";

// Voter interface for type safety
interface VoterCredentials {
  firstName: string;
  lastName: string;
  voterId: string;
  pollingLocation: string;
  email: string;
}

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ensure only POST requests are accepted
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Validate request body
  const { voters } = req.body;

  if (!voters || !Array.isArray(voters)) {
    return res
      .status(400)
      .json({
        error: "Invalid request. Provide an array of voter credentials.",
      });
  }

  try {
    // Process each voter's credentials
    const emailPromises = voters.map(async (voter: VoterCredentials) => {
      // Validate voter credentials
      if (!voter.email || !voter.firstName || !voter.voterId) {
        console.warn(
          `Skipping voter due to incomplete credentials: ${voter.firstName} ${voter.lastName}`
        );
        return null;
      }

      // Create React element and convert to static markup
      const emailElement = createElement(EmailTemplate, {
        firstName: voter.firstName,
        lastName: voter.lastName,
        voterId: voter.voterId,
        pollingLocation: voter.pollingLocation || "To be determined",
      });

      // Send individual email for each voter
      return resend.emails.send({
        from: "Election Commission <votercredentials@yourelectioncommission.org>",
        to: [voter.email],
        subject: "Your Voter Credentials and Polling Information",
        react: emailElement,
        // Optional: Add additional security headers
        headers: {
          "X-Voter-ID": voter.voterId,
        },
      });
    });

    // Wait for all emails to be processed
    const results = await Promise.allSettled(emailPromises);

    // Analyze email sending results
    const successfulEmails = results.filter(
      (result) => result.status === "fulfilled" && result.value
    );
    const failedEmails = results.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && !result.value)
    );

    return res.status(200).json({
      message: "Email sending process completed",
      successful: successfulEmails.length,
      failed: failedEmails.length,
      total: voters.length,
    });
  } catch (error) {
    console.error("Error sending voter credentials emails:", error);
    return res.status(500).json({ error: "Failed to send voter credentials" });
  }
}
