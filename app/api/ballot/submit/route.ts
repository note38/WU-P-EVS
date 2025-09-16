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
      return authResult.response;
    }

    const { voterId } = authResult;

    const body = await request.json();

    if (!body.selections) {
      return NextResponse.json(
        { error: "Missing required selection data" },
        { status: 400 }
      );
    }

    // Use the voter ID from the database user
    const result = await submitBallot({
      selections: body.selections,
      voterId: voterId,
      submittedAt: new Date(),
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Error submitting ballot:", error);
    return NextResponse.json(
      { error: "Failed to submit ballot" },
      { status: 500 }
    );
  }
}
