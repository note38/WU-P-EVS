import { auth } from "@clerk/nextjs/server";
import { getPositionsWithCandidates } from "@/lib/ballot-service";
import { getUserByClerkId } from "@/lib/clerk-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user information
    const user = await getUserByClerkId(userId);

    // Check if user is a voter
    if (!user || user.type !== "voter") {
      return NextResponse.json(
        { error: "User is not a voter" },
        { status: 400 }
      );
    }

    // Check if voter has an election assigned
    // @ts-ignore: TypeScript doesn't recognize the dynamic structure correctly
    if (!user.user.election) {
      return NextResponse.json(
        { error: "Voter not assigned to an election" },
        { status: 400 }
      );
    }

    // @ts-ignore: TypeScript doesn't recognize the dynamic structure correctly
    const positions = await getPositionsWithCandidates(user.user.election.id);
    return NextResponse.json({ positions });
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
