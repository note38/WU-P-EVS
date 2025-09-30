import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/clerk-auth";
import { clerkClient } from "@clerk/nextjs/server";

// Rate limiting for password changes
const passwordChangeAttempts = new Map<
  number,
  { count: number; timestamp: number }
>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3;

function checkRateLimit(userId: number): {
  allowed: boolean;
  resetTime?: number;
} {
  const now = Date.now();
  const userAttempts = passwordChangeAttempts.get(userId);

  if (!userAttempts) {
    passwordChangeAttempts.set(userId, { count: 1, timestamp: now });
    return { allowed: true };
  }

  // Check if the window has expired
  if (now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
    passwordChangeAttempts.set(userId, { count: 1, timestamp: now });
    return { allowed: true };
  }

  // Check if limit exceeded
  if (userAttempts.count >= MAX_ATTEMPTS) {
    const resetTime = userAttempts.timestamp + RATE_LIMIT_WINDOW;
    return { allowed: false, resetTime };
  }

  // Increment count
  passwordChangeAttempts.set(userId, {
    count: userAttempts.count + 1,
    timestamp: now,
  });
  return { allowed: true };
}

function clearRateLimit(userId: number): void {
  passwordChangeAttempts.delete(userId);
}

// GET user profile data
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`GET /api/users/profile: Fetching profile for user ${userId}`);

    // Get user data from database using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        position: true,
        role: true,
      },
      // Removed cacheStrategy as it's not supported in this version
    });

    if (!user) {
      console.log(
        `GET /api/users/profile: User ${userId} not found in database`
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(
      `GET /api/users/profile: Found user ${userId} with position:`,
      user.position
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PATCH(request: Request) {
  let userId: string | null = null;
  try {
    const auth_result = await auth();
    userId = auth_result.userId;

    if (!userId) {
      console.log("PATCH /api/users/profile: Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`PATCH /api/users/profile: Authenticated user ${userId}`);

    // Get user data from database using Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
      },
    });

    if (!dbUser) {
      console.log(
        `PATCH /api/users/profile: User ${userId} not found in database`
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const requestData = await request.json();
    const { position } = requestData;

    console.log(
      `PATCH /api/users/profile: Updating position for user ${userId} to:`,
      position
    );

    // Update user position in database
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        position: position || null, // Allow empty string to be stored as null
      },
      select: {
        id: true,
        position: true,
      },
    });

    console.log(
      `PATCH /api/users/profile: Successfully updated user ${userId}`,
      updatedUser
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// DELETE current user's own account
export async function DELETE() {
  try {
    console.log("DELETE /api/users/profile: Starting account deletion process");

    const { userId } = await auth();

    console.log("DELETE /api/users/profile: Auth result:", { userId });

    if (!userId) {
      console.log("DELETE /api/users/profile: Unauthorized - no userId");
      return NextResponse.json(
        { error: "Unauthorized - no user ID provided" },
        { status: 401 }
      );
    }

    console.log(`DELETE /api/users/profile: Authenticated user ${userId}`);

    // Get user data from database
    console.log(
      "DELETE /api/users/profile: Attempting to get user data from database"
    );
    const userData = await getUserByClerkId(userId);

    console.log("DELETE /api/users/profile: User data retrieved:", userData);

    if (!userData) {
      console.log(
        `DELETE /api/users/profile: User ${userId} not found in database`
      );
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log(
      `DELETE /api/users/profile: Found user ${userId} as ${userData.type}`
    );

    // Delete user from our database first
    try {
      if (userData.type === "admin") {
        console.log(
          `DELETE /api/users/profile: Attempting to delete admin user ${userId} from database`
        );
        await prisma.user.delete({
          where: { clerkId: userId },
        });
        console.log(
          `DELETE /api/users/profile: Deleted admin user ${userId} from database`
        );
      } else if (userData.type === "voter") {
        console.log(
          `DELETE /api/users/profile: Attempting to delete voter user ${userId} from database`
        );
        await prisma.voter.delete({
          where: { clerkId: userId },
        });
        console.log(
          `DELETE /api/users/profile: Deleted voter user ${userId} from database`
        );
      }
    } catch (dbError: any) {
      console.error(
        "DELETE /api/users/profile: Error deleting user from database:",
        dbError
      );
      return NextResponse.json(
        {
          error: `Database error: ${dbError.message || "Failed to delete user from database"}`,
        },
        { status: 500 }
      );
    }

    // Now delete the user from Clerk using the backend API
    try {
      console.log(
        `DELETE /api/users/profile: Attempting to delete user ${userId} from Clerk`
      );
      // Use dynamic import like in other working files
      const { clerkClient } = await import("@clerk/nextjs/server");
      const clerk = await clerkClient();
      await clerk.users.deleteUser(userId);
      console.log(
        `DELETE /api/users/profile: Deleted user ${userId} from Clerk`
      );
    } catch (clerkError: any) {
      console.error(
        "DELETE /api/users/profile: Error deleting user from Clerk:",
        clerkError
      );
      // Even if Clerk deletion fails, we've already deleted from our database
      // The webhook should handle cleanup if needed

      // Return the specific Clerk error message
      let errorMessage = "Failed to delete user from authentication service";
      if (clerkError.errors && clerkError.errors[0]) {
        errorMessage = `Clerk error: ${clerkError.errors[0].message || clerkError.errors[0].code || "Unknown Clerk error"}`;
      } else if (clerkError.message) {
        errorMessage = `Clerk error: ${clerkError.message}`;
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    console.log(
      `DELETE /api/users/profile: Account deletion completed successfully`
    );
    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/users/profile: Account deletion error:", error);

    // If it's a Clerk error about verification, return a more specific message
    if (
      error.errors &&
      error.errors[0]?.code === "form_password_purpose_invalid"
    ) {
      return NextResponse.json(
        {
          error:
            "Additional verification required to delete account. Please contact support.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: `Failed to delete account: ${error.message || "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
