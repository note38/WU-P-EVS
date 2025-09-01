import { submitBallot } from "@/lib/ballot-service";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get session to validate the user is a voter
    const { userId } = await auth();

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Get user data from database to check if they're a voter
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/get-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = await userResponse.json();

    if (userData.type !== "voter") {
      return NextResponse.json(
        { error: "Unauthorized access - Voter access only" },
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

    // Use the voter ID from the database user
    const result = await submitBallot({
      selections: body.selections,
      voterId: userData.user.id,
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
