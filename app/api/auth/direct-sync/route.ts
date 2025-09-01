import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
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

    console.log(`🔍 Direct sync for user ${userId} with email ${email}`);

    // Check if user exists in our database
    let userType = null;
    let existingUser = null;

    // Check admin users
    const adminUser = await prisma.user.findUnique({
      where: { email },
    });

    if (adminUser) {
      userType = "admin";
      existingUser = adminUser;
    } else {
      // Check voters
      const voter = await prisma.voter.findUnique({
        where: { email },
      });

      if (voter) {
        userType = "voter";
        existingUser = voter;
      }
    }

    if (!userType || !existingUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log(`✅ User found as ${userType}, updating with Clerk ID`);

    // Update the user with Clerk ID
    if (userType === "admin") {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkId: userId,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.voter.update({
        where: { id: existingUser.id },
        data: {
          clerkId: userId,
          updatedAt: new Date(),
        },
      });
    }

    console.log(`✅ User synced successfully as ${userType}`);

    return NextResponse.json({
      success: true,
      userType,
      message: `User synced successfully as ${userType}`,
      userId,
      email,
    });
  } catch (error) {
    console.error("Error in direct sync:", error);
    return NextResponse.json(
      {
        error: "Failed to sync user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
