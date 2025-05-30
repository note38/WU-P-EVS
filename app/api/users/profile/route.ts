import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  validatePasswordStrength,
  checkPasswordSecurity,
  sanitizeErrorForLog,
} from "@/lib/utils";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// Simple in-memory rate limiting for password change attempts
const passwordChangeAttempts = new Map();

const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
};

function isRateLimited(userId: number): boolean {
  const now = Date.now();
  const userAttempts = passwordChangeAttempts.get(userId) || {
    count: 0,
    resetTime: now + RATE_LIMIT.WINDOW_MS,
  };

  if (now > userAttempts.resetTime) {
    // Reset the window
    passwordChangeAttempts.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS,
    });
    return false;
  }

  if (userAttempts.count >= RATE_LIMIT.MAX_ATTEMPTS) {
    return true;
  }

  // Increment attempt count
  passwordChangeAttempts.set(userId, {
    count: userAttempts.count + 1,
    resetTime: userAttempts.resetTime,
  });
  return false;
}

function clearRateLimit(userId: number): void {
  passwordChangeAttempts.delete(userId);
}

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
    if (data.hasOwnProperty("avatar")) {
      updateData.avatar = data.avatar;
    }

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
  let session;
  let userId: number = 0;

  try {
    session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = parseInt(session.user.id);

    // Validate user ID
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 400 }
      );
    }

    // Check rate limiting
    if (isRateLimited(userId)) {
      console.warn(`Rate limited password change attempt for user ${userId}`);
      return NextResponse.json(
        {
          error:
            "Too many password change attempts. Please wait 15 minutes before trying again.",
          retryAfter: RATE_LIMIT.WINDOW_MS,
        },
        { status: 429 }
      );
    }

    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 });
    }

    // Comprehensive validation of password data
    if (!data.currentPassword || !data.newPassword) {
      return NextResponse.json(
        { error: "Current and new passwords are required" },
        { status: 400 }
      );
    }

    // Validate password types
    if (
      typeof data.currentPassword !== "string" ||
      typeof data.newPassword !== "string"
    ) {
      return NextResponse.json(
        { error: "Passwords must be valid strings" },
        { status: 400 }
      );
    }

    // Check if new password is different from current password
    if (data.currentPassword === data.newPassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Use the utility function for comprehensive password validation
    const passwordValidation = validatePasswordStrength(data.newPassword);

    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: "Password does not meet security requirements",
          details: passwordValidation.feedback,
        },
        { status: 400 }
      );
    }

    // Check for common security issues
    const securityCheck = checkPasswordSecurity(data.newPassword);

    if (securityCheck.hasCommonPatterns) {
      return NextResponse.json(
        {
          error: "Password contains common patterns that make it less secure",
          warnings: securityCheck.warnings,
        },
        { status: 400 }
      );
    }

    // Get user with password - minimal data selection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true, // For logging purposes
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "User account is not properly configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Verify current password
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(
        data.currentPassword,
        user.password
      );
    } catch (bcryptError) {
      console.error("Bcrypt comparison error:", bcryptError);
      return NextResponse.json(
        { error: "Password verification failed" },
        { status: 500 }
      );
    }

    if (!isPasswordValid) {
      // Log failed password attempt with sanitized information
      console.warn(
        sanitizeErrorForLog(
          "Failed password change attempt - incorrect current password",
          userId
        )
      );

      return NextResponse.json(
        {
          error: "Current password is incorrect",
          message:
            "The password you entered does not match your current password. Please check your password and try again.",
          hint: "Make sure you're using the same password you use to log in to your account",
        },
        { status: 401 }
      );
    }

    // Hash new password with error handling
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(data.newPassword, 12); // Increased from 10 to 12 for better security
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return NextResponse.json(
        { error: "Failed to process new password" },
        { status: 500 }
      );
    }

    // Update password with transaction for data integrity
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
            // Optionally, you could add a passwordUpdatedAt field here
          },
          select: { id: true }, // Minimal selection for faster response
        });
      });
    } catch (updateError) {
      console.error("Password update transaction error:", updateError);
      return NextResponse.json(
        { error: "Failed to update password in database" },
        { status: 500 }
      );
    }

    // Log successful password change and clear rate limits
    console.log(sanitizeErrorForLog("Password successfully updated", userId));
    clearRateLimit(userId);

    return NextResponse.json({
      message: "Password updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Password update error:", sanitizeErrorForLog(error, userId));

    // Don't expose internal error details to client
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
