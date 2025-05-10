import { submitBallot } from "@/lib/ballot-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.selections || !body.voterId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await submitBallot({
      selections: body.selections,
      voterId: body.voterId,
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
