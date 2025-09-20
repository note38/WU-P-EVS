import { getPositionsWithCandidates } from "@/lib/ballot-service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const positions = await getPositionsWithCandidates();
    return NextResponse.json({ positions });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
