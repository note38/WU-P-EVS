import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/clerk-auth";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from Clerk
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: "No email address found" },
        { status: 400 }
      );
    }

    // Check if user exists in our database
    const userData = await getUserByClerkId(userId);

    return NextResponse.json({
      clerkUser: {
        id: userId,
        email: email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        username: clerkUser.username,
        imageUrl: clerkUser.imageUrl,
      },
      databaseUser: userData
        ? {
            type: userData.type,
            id: userData.user.id,
            role: userData.user.role,
            clerkId: userData.user.clerkId,
            email: (userData.user as any).email,
          }
        : null,
      isSynced: userData !== null,
      message: userData
        ? `User is synced as ${userData.type}`
        : "User is not synced with database",
    });
  } catch (error) {
    console.error("Error checking user sync:", error);
    return NextResponse.json(
      { error: "Failed to check user sync" },
      { status: 500 }
    );
  }
}
