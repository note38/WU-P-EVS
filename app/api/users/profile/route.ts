import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// GET user profile data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
      },
      cacheStrategy: { ttl: 30 }, // 30 seconds TTL for cache
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const data = await request.json();

    // Prepare update data object
    const updateData: any = {};

    // Update profile fields if provided
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.avatar) updateData.avatar = data.avatar;

    // Update user in database with minimal data selection for faster response
    const updatedUser = await prisma.$transaction(
      async (tx) => {
        // Update the user
        const user = await tx.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            role: true,
          },
        });

        return user;
      },
      {
        // Transaction optimization options
        maxWait: 5000, // 5 seconds max wait time
        timeout: 10000, // 10 seconds timeout
        isolationLevel: "ReadCommitted", // Less strict isolation for better performance
      }
    );

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// Update user password
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const data = await request.json();

    // Validate password data
    if (!data.currentPassword || !data.newPassword) {
      return NextResponse.json(
        { error: "Current and new passwords are required" },
        { status: 400 }
      );
    }

    // Get user with password - minimal data selection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password - this is CPU-intensive but can't be optimized easily
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update password with minimal return data
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
      select: { id: true }, // Minimal selection for faster response
    });

    return NextResponse.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
