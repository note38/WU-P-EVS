import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  validatePasswordStrength,
  checkPasswordSecurity,
  sanitizeErrorForLog,
} from "@/lib/utils";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  let userId: string | null = null;
  try {
    const auth_result = await auth();
    userId = auth_result.userId;

    if (!userId) {
      console.log("PATCH /api/users/profile: Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database using Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!dbUser) {
      console.log(
        `PATCH /api/users/profile: User not found for clerkId: ${userId}`
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await request.json();
    console.log("PATCH /api/users/profile: Received update data:", data);

    // Prepare update data object
    const updateData: any = {};

    // Update profile fields if provided
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.position !== undefined) updateData.position = data.position;

    console.log("PATCH /api/users/profile: Update data prepared:", updateData);

    // Handle avatar update
    if (data.hasOwnProperty("avatar")) {
      if (data.avatar) {
        // If it's a base64 image
        if (data.avatar.startsWith("data:image")) {
          const base64Data = data.avatar.split(";base64,").pop();
          if (!base64Data) {
            throw new Error("Invalid image data");
          }

          // Create avatars directory if it doesn't exist
          const publicDir = join(process.cwd(), "public");
          const avatarsDir = join(publicDir, "avatars");
          await mkdir(avatarsDir, { recursive: true });

          // Create a unique filename with .webp extension
          const filename = `${uuidv4()}.webp`;
          const filePath = join(avatarsDir, filename);

          // Save the file
          await writeFile(filePath, Buffer.from(base64Data, "base64"));

          // Update the avatar path in the database
          updateData.avatar = `/avatars/${filename}`;
        } else {
          // If it's already a path, keep it as is
          updateData.avatar = data.avatar;
        }
      } else {
        // If avatar is null, remove it
        updateData.avatar = null;
      }
    }

    // Update user in database with minimal data selection for faster response
    const updatedUser = await prisma.$transaction(
      async (tx) => {
        console.log(
          `PATCH /api/users/profile: Updating user ${dbUser.id} with data:`,
          updateData
        );
        // Update the user
        const user = await tx.user.update({
          where: { id: dbUser.id },
          data: updateData,
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            position: true,
            role: true,
          },
        });
        console.log(
          `PATCH /api/users/profile: User updated successfully:`,
          user
        );
        return user;
      },
      {
        // Transaction optimization options
        maxWait: 5000, // 5 seconds max wait time
        timeout: 10000, // 10 seconds timeout
        isolationLevel: "ReadCommitted", // Less strict isolation for better performance
      }
    );

    // Return response with cache control headers
    const response = NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

    // Set cache control headers
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable" // Cache for 1 year since we use unique filenames
    );

    return response;
  } catch (error: any) {
    console.error("PATCH /api/users/profile - Profile update error:", {
      error: error?.message || "Unknown error",
      stack: error?.stack,
      name: error?.name,
      userId: userId || "unknown",
    });

    // Provide more specific error messages
    let errorMessage = "Failed to update profile";
    let statusCode = 500;

    if (error?.code === "P2002") {
      errorMessage = "Username or email already exists";
      statusCode = 409;
    } else if (error?.code === "P2025") {
      errorMessage = "User record not found";
      statusCode = 404;
    } else if (error?.name === "PrismaClientValidationError") {
      errorMessage = "Invalid data format";
      statusCode = 400;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: statusCode }
    );
  }
}

// Update user password
export async function PUT(request: Request) {
  let userId: number = 0;

  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database using Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    userId = dbUser.id;

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
