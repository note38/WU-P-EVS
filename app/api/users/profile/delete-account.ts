import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/clerk-auth";
import { clerkClient } from "@clerk/nextjs/server";

// DELETE current user's own account
export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from database
    const userData = await getUserByClerkId(userId);

    if (!userData) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Delete user from our database first
    if (userData.type === "admin") {
      await prisma.user.delete({
        where: { clerkId: userId },
      });
    } else if (userData.type === "voter") {
      await prisma.voter.delete({
        where: { clerkId: userId },
      });
    }

    // Now delete the user from Clerk using the backend API
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);

    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Account deletion error:", error);
    
    // If it's a Clerk error about verification, return a more specific message
    if (error.errors && error.errors[0]?.code === "form_password_purpose_invalid") {
      return NextResponse.json(
        { error: "Additional verification required to delete account. Please contact support." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete account. Please try again or contact support." },
      { status: 500 }
    );
  }
}