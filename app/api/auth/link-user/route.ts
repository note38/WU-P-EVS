import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.log("❌ No userId found in auth");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔗 Linking user: ${userId}`);

    // Get user data from Clerk
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();

    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(userId);
    } catch (error) {
      console.error(`❌ Error fetching user ${userId} from Clerk:`, error);
      return NextResponse.json(
        { error: "User not found in Clerk" },
        { status: 404 }
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error(`❌ No email address found for user ${userId}`);
      return NextResponse.json(
        { error: "No email address found" },
        { status: 400 }
      );
    }

    console.log(`📧 Linking user with email: ${email}`);

    // Check if user exists in database and link Clerk ID
    let userType = null;
    let linkedUser = null;

    // Check admin users
    const adminUser = await prisma.user.findUnique({
      where: { email },
    });

    if (adminUser) {
      userType = "admin";

      if (adminUser.clerkId === userId) {
        console.log("✅ Admin user already has correct Clerk ID");
        linkedUser = adminUser;
      } else {
        // Update with Clerk ID
        linkedUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: {
            clerkId: userId,
          },
        });
        console.log("✅ Admin user linked with Clerk ID");
      }
    } else {
      // Check voters
      const voter = await prisma.voter.findUnique({
        where: { email },
      });

      if (voter) {
        userType = "voter";

        if (voter.clerkId === userId) {
          console.log("✅ Voter already has correct Clerk ID");
          linkedUser = voter;
        } else {
          // Update with Clerk ID
          linkedUser = await prisma.voter.update({
            where: { id: voter.id },
            data: {
              clerkId: userId,
            },
          });
          console.log("✅ Voter linked with Clerk ID");
        }
      }
    }

    if (!userType || !linkedUser) {
      console.error(`❌ No user found with email: ${email}`);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log(`✅ User linked successfully as ${userType}`);

    return NextResponse.json({
      success: true,
      userType,
      message: `User linked successfully as ${userType}`,
      userId: linkedUser.id,
      email,
      clerkId: userId,
    });
  } catch (error) {
    console.error("❌ Error linking user:", error);
    return NextResponse.json(
      {
        error: "Failed to link user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
