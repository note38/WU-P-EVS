import { prisma } from "@/lib/db";

export interface ClerkUserData {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
    linked_to: Array<any>;
    object: string;
    verification: {
      status: string;
      strategy: string;
    } | null;
  }>;
  first_name?: string;
  last_name?: string;
  username?: string;
  image_url?: string;
  created_at: number;
  updated_at: number;
}

export interface ClerkDeletedData {
  id: string;
  object: string;
  deleted: boolean;
}

/**
 * Check if a user with the given email exists in the database
 * Returns the user type ('admin', 'voter', or null if not found)
 */
export async function checkUserExists(
  email: string
): Promise<"admin" | "voter" | null> {
  try {
    // Check if email exists in admin users
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (adminUser) {
      return "admin";
    }

    // Check if email exists in voters
    const voter = await prisma.voter.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (voter) {
      return "voter";
    }

    return null;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return null;
  }
}

/**
 * Create or update admin user from Clerk data
 */
export async function syncAdminUser(clerkData: ClerkUserData) {
  try {
    // Validate input
    if (!clerkData || !clerkData.id) {
      throw new Error("Invalid Clerk data: missing id");
    }

    const email = clerkData.email_addresses[0]?.email_address;
    if (!email) {
      throw new Error("No email address found in Clerk data");
    }

    console.log(`🔄 Syncing admin user: ${clerkData.id} (${email})`);

    // Check if user already exists by Clerk ID
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkData.id },
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { clerkId: clerkData.id },
        data: {
          email,
          username: clerkData.username || email.split("@")[0],
          avatar: clerkData.image_url,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Admin user updated: ${updatedUser.id}`);
      return updatedUser;
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          clerkId: clerkData.id,
          email,
          username: clerkData.username || email.split("@")[0],
          avatar: clerkData.image_url || "",
          role: "ADMIN",
        },
      });
      console.log(`✅ Admin user created: ${newUser.id}`);
      return newUser;
    }
  } catch (error) {
    console.error("Error syncing admin user:", error);
    throw error;
  }
}

/**
 * Create or update voter from Clerk data
 */
export async function syncVoter(clerkData: ClerkUserData) {
  try {
    // Validate input
    if (!clerkData || !clerkData.id) {
      throw new Error("Invalid Clerk data: missing id");
    }

    const email = clerkData.email_addresses[0]?.email_address;
    if (!email) {
      throw new Error("No email address found in Clerk data");
    }

    console.log(`🔄 Syncing voter: ${clerkData.id} (${email})`);

    // Check if voter already exists by Clerk ID
    const existingVoter = await prisma.voter.findUnique({
      where: { clerkId: clerkData.id },
    });

    if (existingVoter) {
      // Update existing voter
      const updatedVoter = await prisma.voter.update({
        where: { clerkId: clerkData.id },
        data: {
          email,
          firstName: clerkData.first_name || "",
          lastName: clerkData.last_name || "",
          avatar: clerkData.image_url,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Voter updated: ${updatedVoter.id}`);
      return updatedVoter;
    } else {
      // Find the voter by email to get existing data
      const existingVoterByEmail = await prisma.voter.findUnique({
        where: { email },
      });

      if (!existingVoterByEmail) {
        throw new Error("Voter not found in database");
      }

      // Update the existing voter with Clerk ID
      const updatedVoter = await prisma.voter.update({
        where: { email },
        data: {
          clerkId: clerkData.id,
          firstName: clerkData.first_name || existingVoterByEmail.firstName,
          lastName: clerkData.last_name || existingVoterByEmail.lastName,
          avatar: clerkData.image_url || existingVoterByEmail.avatar,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Voter linked with Clerk ID: ${updatedVoter.id}`);
      return updatedVoter;
    }
  } catch (error) {
    console.error("Error syncing voter:", error);
    throw error;
  }
}

/**
 * Delete user from database when deleted from Clerk
 */
export async function deleteUser(clerkId: string) {
  try {
    // Try to delete from admin users first
    const deletedAdmin = await prisma.user.deleteMany({
      where: { clerkId },
    });

    if (deletedAdmin.count > 0) {
      return { type: "admin", success: true };
    }

    // Try to delete from voters
    const deletedVoter = await prisma.voter.deleteMany({
      where: { clerkId },
    });

    if (deletedVoter.count > 0) {
      return { type: "voter", success: true };
    }

    return { type: null, success: false };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

/**
 * Get user data by Clerk ID
 */
export async function getUserByClerkId(clerkId: string) {
  try {
    // Try to find admin user
    const adminUser = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        elections: true,
      },
    });

    if (adminUser) {
      return { type: "admin", user: adminUser };
    }

    // Try to find voter
    const voter = await prisma.voter.findUnique({
      where: { clerkId },
      include: {
        election: true,
        year: true,
      },
    });

    if (voter) {
      return { type: "voter", user: voter };
    }

    return null;
  } catch (error) {
    console.error("Error getting user by Clerk ID:", error);
    return null;
  }
}
