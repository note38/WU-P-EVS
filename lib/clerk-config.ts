import { clerkClient } from "@clerk/nextjs/server";
import { checkUserExists } from "./clerk-auth";

export const clerkConfig = {
  // Prevent unauthorized sign-ups
  signUp: {
    // Disable automatic sign-up - only allow through webhook
    enabled: false,
  },
  // Custom sign-in validation
  signIn: {
    // We'll handle validation in our custom hooks
    enabled: true,
  },
};

/**
 * Validate if a user can sign in based on database permissions
 */
export async function validateUserSignIn(email: string) {
  try {
    const userType = await checkUserExists(email);

    if (!userType) {
      return {
        allowed: false,
        message:
          "Email not found in our database. Please contact an administrator.",
        userType: null,
      };
    }

    return {
      allowed: true,
      message: `User found as ${userType}`,
      userType,
    };
  } catch (error) {
    console.error("Error validating user sign-in:", error);
    return {
      allowed: false,
      message: "An error occurred while validating your account.",
      userType: null,
    };
  }
}

/**
 * Set user role in Clerk based on database role
 */
export async function setUserRole(
  clerkUserId: string,
  userType: "admin" | "voter"
) {
  try {
    // Validate inputs
    if (!clerkUserId || typeof clerkUserId !== "string") {
      throw new Error(`Invalid clerkUserId: ${clerkUserId}`);
    }

    if (!userType || !["admin", "voter"].includes(userType)) {
      throw new Error(`Invalid userType: ${userType}`);
    }

    const clerk = await clerkClient();
    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: {
        role: userType,
        userType: userType,
      },
    });

    console.log(`✅ Role set for user ${clerkUserId}: ${userType}`);
  } catch (error) {
    console.error(`Error setting user role for ${clerkUserId}:`, error);
    throw error;
  }
}

/**
 * Get user role from Clerk metadata
 */
export async function getUserRole(clerkUserId: string) {
  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    return user.publicMetadata?.role as "admin" | "voter" | null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Check if user has admin permissions
 */
export async function hasAdminPermissions(clerkUserId: string) {
  const role = await getUserRole(clerkUserId);
  return role === "admin";
}

/**
 * Check if user has voter permissions
 */
export async function hasVoterPermissions(clerkUserId: string) {
  const role = await getUserRole(clerkUserId);
  return role === "voter";
}
