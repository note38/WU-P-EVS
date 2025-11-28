import { submitBallot } from "@/lib/ballot-service";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/clerk-auth";
import { validateVoterAccess } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // Validate voter access
    const authResult = await validateVoterAccess();
    if (!authResult.success) {
      console.error("Authentication failed for ballot submission:", authResult);
      return authResult.response;
    }

    const { voterId } = authResult;

    // Log for debugging
    console.log("Voter ID from auth validation:", voterId);

    const body = await request.json();

    // Log for debugging
    console.log("Ballot submission body:", body);

    if (!body.selections) {
      return NextResponse.json(
        { error: "Missing required selection data" },
        { status: 400 }
      );
    }

    // Use the voter ID from the database user
    const result = await submitBallot({
      selections: body.selections,
      voterId: String(voterId), // Convert to string to match BallotSubmission interface
      submittedAt: new Date(),
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Ballot submission error:", result.error);
      // Return a user-friendly error message
      let userMessage =
        "There was an issue with your ballot submission. Please review your selections and try again.";

      // Provide more specific messages based on the error type
      if (result.error && typeof result.error === "string") {
        if (result.error.includes("Invalid position ID")) {
          userMessage =
            "Your ballot contains invalid positions. These may be from a previous election. Please review your ballot and try again.";
        } else if (result.error.includes("Invalid candidate ID")) {
          userMessage =
            "Your ballot contains invalid candidates. Please review your ballot and try again.";
        } else if (result.error.includes("Voter with ID")) {
          userMessage =
            "There was an issue verifying your voter information. Please try again or contact support.";
        } else if (
          result.error.includes("already voted") ||
          result.error.includes("Voter has already voted")
        ) {
          userMessage = "You have already submitted your ballot.";
        } else if (result.error.includes("not assigned to an election")) {
          userMessage =
            "You are not assigned to an election. Please contact support.";
        }
      }

      const responsePayload = {
        error: result.error,
        message: userMessage,
      };

      console.log("Sending error response:", responsePayload);
      return NextResponse.json(responsePayload, { status: 400 });
    }
  } catch (error) {
    console.error("Error submitting ballot:", error);
    return NextResponse.json(
      { error: "Failed to submit ballot" },
      { status: 500 }
    );
  }
}
