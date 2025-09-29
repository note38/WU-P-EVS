import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/clerk-auth";

// DELETE a user by ID (only for admins)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from database to check if they're an admin
    const userData = await getUserByClerkId(userId);

    if (!userData) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    if (userData.type !== "admin" || userData.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const userIdToDelete = parseInt(params.id);

    if (isNaN(userIdToDelete)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get the user to delete
    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdToDelete },
      select: { id: true, clerkId: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deletion of users with Clerk ID
    if (userToDelete.clerkId) {
      return NextResponse.json(
        { error: "Cannot delete users with Clerk ID" },
        { status: 400 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
