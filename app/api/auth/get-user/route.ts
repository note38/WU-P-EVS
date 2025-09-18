import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/clerk-auth";

export async function GET(req: NextRequest) {
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

    // Return user data in a format suitable for the client
    const responseData = {
      id: userData.user.id,
      clerkId: userId,
      email: userData.user.email,
      role: userData.user.role,
      userType: userData.type,
      // Include additional data based on user type
      ...(userData.type === "admin" && {
        username: (userData.user as any).username,
        avatar: (userData.user as any).avatar,
      }),
      ...(userData.type === "voter" && {
        firstName: (userData.user as any).firstName,
        lastName: (userData.user as any).lastName,
        status: (userData.user as any).status,
        electionId: (userData.user as any).electionId,
        yearId: (userData.user as any).yearId,
      }),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Error getting user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: providedUserId } = await req.json();

    // Use the provided userId or get from auth context
    const { userId: authUserId } = await auth();
    const userId = providedUserId || authUserId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from database
    const userData = await getUserByClerkId(userId);

    if (!userData) {
      // Log the unauthorized access attempt
      console.warn(`🚫 User not found in database: ${userId}`);
      
      return NextResponse.json(
        { 
          error: "Email not registered", 
          message: "This email is not registered in our voting system. Please contact an administrator or try with a different email.",
          shouldRedirect: true
        },
        { status: 404 }
      );
    }

    // Return user data in a format suitable for the client
    const responseData = {
      type: userData.type,
      user: {
        id: userData.user.id,
        clerkId: userId,
        email: userData.user.email,
        role: userData.user.role,
        // Include additional data based on user type
        ...(userData.type === "admin" && {
          username: (userData.user as any).username,
          avatar: (userData.user as any).avatar,
        }),
        ...(userData.type === "voter" && {
          firstName: (userData.user as any).firstName,
          lastName: (userData.user as any).lastName,
          status: (userData.user as any).status,
          electionId: (userData.user as any).electionId,
          yearId: (userData.user as any).yearId,
        }),
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Error getting user data (POST):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
