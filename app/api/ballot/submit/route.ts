import { submitBallot } from "@/lib/ballot-service";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get session to validate the user is a voter
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is a voter
    if (!session || !session.user || session.user.userType !== "voter") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.selections) {
      return NextResponse.json(
        { error: "Missing required selection data" },
        { status: 400 }
      );
    }

    // Use the voter ID from the session instead of client submission
    const result = await submitBallot({
      selections: body.selections,
      voterId: session.user.id,
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
