import { clerkClient } from "@clerk/nextjs/server";

export default {
  // Disable sign-ups - only allow through webhook
  signUp: {
    enabled: false,
  },
  // Enable sign-ins with custom validation
  signIn: {
    enabled: true,
  },
  // Configure sign-out behavior
  signOut: {
    // Remove the default redirect URL to prevent it from overriding custom redirects
    // redirectUrl: "/",  // This was causing the redirect issue
  },
  // Use custom sign-in page instead of hosted
  appearance: {
    layout: {
      socialButtonsPlacement: "bottom",
    },
  },
  // Custom user creation hook
  hooks: {
    beforeCreateUser: async (user: any) => {
      // This will prevent any user creation outside of webhook
      throw new Error("User creation is not allowed");
    },
  },
};

// Helper function to check if user has admin permissions
export async function hasAdminPermissions(userId: string) {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    return user.publicMetadata?.role === "admin";
  } catch (error) {
    console.error("Error checking admin permissions:", error);
    return false;
  }
}

// Helper function to check if user has voter permissions
export async function hasVoterPermissions(userId: string) {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    return user.publicMetadata?.role === "voter";
  } catch (error) {
    console.error("Error checking voter permissions:", error);
    return false;
  }
}