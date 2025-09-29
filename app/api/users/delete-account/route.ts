import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/clerk-auth";

// DELETE current user's own account
export async function DELETE() {
  try {
    console.log(
      "DELETE /api/users/delete-account: Starting account deletion process"
    );

    const { userId } = await auth();

    console.log("DELETE /api/users/delete-account: Auth result:", { userId });

    if (!userId) {
      console.log("DELETE /api/users/delete-account: Unauthorized - no userId");
      return NextResponse.json(
        { error: "Unauthorized - no user ID provided" },
        { status: 401 }
      );
    }

    console.log(
      `DELETE /api/users/delete-account: Authenticated user ${userId}`
    );

    // Get user data from database
    console.log(
      "DELETE /api/users/delete-account: Attempting to get user data from database"
    );
    const userData = await getUserByClerkId(userId);

    console.log(
      "DELETE /api/users/delete-account: User data retrieved:",
      userData
    );

    if (!userData) {
      console.log(
        `DELETE /api/users/delete-account: User ${userId} not found in database`
      );
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log(
      `DELETE /api/users/delete-account: Found user ${userId} as ${userData.type}`
    );

    // Delete user from our database first
    try {
      if (userData.type === "admin") {
        console.log(
          `DELETE /api/users/delete-account: Attempting to delete admin user ${userId} from database`
        );

        // First, delete or reassign any related elections to avoid foreign key constraint violations
        console.log(
          `DELETE /api/users/delete-account: Handling related elections for user ${userId}`
        );
        const elections = await prisma.election.findMany({
          where: { createdById: userData.user.id },
        });

        console.log(
          `DELETE /api/users/delete-account: Found ${elections.length} elections to handle`
        );

        // For each election, we'll delete it (since it belongs to this user)
        for (const election of elections) {
          console.log(
            `DELETE /api/users/delete-account: Deleting election ${election.id}`
          );
          // Delete related data first due to foreign key constraints
          await prisma.vote.deleteMany({
            where: { electionId: election.id },
          });

          await prisma.candidate.deleteMany({
            where: { electionId: election.id },
          });

          await prisma.position.deleteMany({
            where: { electionId: election.id },
          });

          // Remove voter associations
          await prisma.voter.updateMany({
            where: { electionId: election.id },
            data: { electionId: null },
          });

          // Finally delete the election
          await prisma.election.delete({
            where: { id: election.id },
          });
        }

        // Now delete the user
        await prisma.user.delete({
          where: { clerkId: userId },
        });
        console.log(
          `DELETE /api/users/delete-account: Deleted admin user ${userId} from database`
        );
      } else if (userData.type === "voter") {
        console.log(
          `DELETE /api/users/delete-account: Attempting to delete voter user ${userId} from database`
        );
        await prisma.voter.delete({
          where: { clerkId: userId },
        });
        console.log(
          `DELETE /api/users/delete-account: Deleted voter user ${userId} from database`
        );
      }
    } catch (dbError: any) {
      console.error(
        "DELETE /api/users/delete-account: Error deleting user from database:",
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
        `DELETE /api/users/delete-account: Attempting to delete user ${userId} from Clerk`
      );
      // Use dynamic import like in other working files
      const { clerkClient } = await import("@clerk/nextjs/server");
      const clerk = await clerkClient();
      await clerk.users.deleteUser(userId);
      console.log(
        `DELETE /api/users/delete-account: Deleted user ${userId} from Clerk`
      );
    } catch (clerkError: any) {
      console.error(
        "DELETE /api/users/delete-account: Error deleting user from Clerk:",
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
      `DELETE /api/users/delete-account: Account deletion completed successfully`
    );
    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "DELETE /api/users/delete-account: Account deletion error:",
      error
    );

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
