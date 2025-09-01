import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, checkUserExists } from "@/lib/clerk-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      userId: userId || null,
      hasAuth: !!userId,
    };

    if (!userId) {
      return NextResponse.json({
        ...debugInfo,
        message: "No user authenticated",
      });
    }

    // Get Clerk user data
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();

    let clerkUser = null;
    let clerkError = null;

    try {
      clerkUser = await clerk.users.getUser(userId);
    } catch (error) {
      clerkError = error;
    }

    // Get database user data
    let dbUser = null;
    let dbError = null;

    try {
      dbUser = await getUserByClerkId(userId);
    } catch (error) {
      dbError = error;
    }

    // Check email existence
    let emailCheck = null;
    if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
      try {
        emailCheck = await checkUserExists(
          clerkUser.emailAddresses[0].emailAddress
        );
      } catch (error) {
        emailCheck = { error: error.message };
      }
    }

    // Check database tables
    let tableCounts = null;
    try {
      const [adminCount, voterCount] = await Promise.all([
        prisma.user.count(),
        prisma.voter.count(),
      ]);
      tableCounts = { adminCount, voterCount };
    } catch (error) {
      tableCounts = { error: error.message };
    }

    return NextResponse.json({
      ...debugInfo,
      clerkUser: clerkUser
        ? {
            id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            username: clerkUser.username,
            publicMetadata: clerkUser.publicMetadata,
          }
        : null,
      clerkError: clerkError?.message || null,
      dbUser,
      dbError: dbError?.message || null,
      emailCheck,
      tableCounts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
