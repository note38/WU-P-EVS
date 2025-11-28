import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Validates admin access for API routes
 * Returns user data if valid admin, otherwise returns error response
 */
export async function validateAdminAccess() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    // Get admin user directly from database
    let adminUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        elections: true,
      },
    });

    // If user not found, try to create them as admin
    if (!adminUser) {
      try {
        console.log(
          "🔄 User not found in database, attempting to create admin user..."
        );

        // Get user from Clerk
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (email) {
          // Create admin user directly
          adminUser = await prisma.user.create({
            data: {
              clerkId: userId,
              email: email,
              username: clerkUser.username || email.split("@")[0],
              avatar: clerkUser.imageUrl || "",
              role: "ADMIN",
            },
            include: {
              elections: true,
            },
          });

          console.log("✅ Admin user created successfully:", adminUser.email);
        }
      } catch (syncError) {
        console.error("❌ Failed to create admin user:", syncError);
      }
    }

    if (!adminUser) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "User not found. Please contact administrator." },
          { status: 404 }
        ),
      };
    }

    if (adminUser.role !== "ADMIN") {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      userData: { type: "admin", user: adminUser },
      userId: adminUser.id,
    };
  } catch (error) {
    console.error("Error validating admin access:", error);
    return {
      success: false,
      response: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Validates voter access for API routes
 * Returns user data if valid voter, otherwise returns error response
 */
export async function validateVoterAccess() {
  try {
    const { userId } = await auth();

    // Log for debugging
    console.log("Clerk user ID from auth:", userId);

    if (!userId) {
      return {
        success: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    // Get voter data directly from database
    const voter = await prisma.voter.findUnique({
      where: { clerkId: userId },
      include: {
        election: true,
        year: true,
      },
    });

    // Log for debugging
    console.log("Voter found in database:", voter);

    if (!voter) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Voter not found" },
          { status: 404 }
        ),
      };
    }

    return {
      success: true,
      userData: { type: "voter", user: voter },
      voterId: voter.id,
    };
  } catch (error) {
    console.error("Error validating voter access:", error);
    return {
      success: false,
      response: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}
