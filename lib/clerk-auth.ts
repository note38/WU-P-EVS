import { prisma } from "@/lib/db";
import * as bcrypt from "bcrypt";

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
    console.log(`🔍 Checking if user exists with email: ${email}`);

    // Check if email exists in admin users
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (adminUser) {
      console.log(`✅ Admin user found with email: ${email}`);
      return "admin";
    }

    // Check if email exists in voters
    const voter = await prisma.voter.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (voter) {
      console.log(`✅ Voter found with email: ${email}`);
      return "voter";
    }

    console.log(`❌ No user found with email: ${email}`);
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
          avatar: clerkData.image_url || "", // Ensure we're storing the avatar URL
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Admin user updated: ${updatedUser.id}`, {
        avatar: updatedUser.avatar,
        clerkId: updatedUser.clerkId,
      });
      return updatedUser;
    } else {
      // Create new user
      // Generate a default password since it's required by the schema
      const defaultPassword = "Admin123!";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const newUser = await prisma.user.create({
        data: {
          clerkId: clerkData.id,
          email,
          username: clerkData.username || email.split("@")[0],
          avatar: clerkData.image_url || "", // Ensure we're storing the avatar URL
          role: "ADMIN",
          password: hashedPassword, // Add the required password field
        },
      });
      console.log(`✅ Admin user created: ${newUser.id}`, {
        avatar: newUser.avatar,
        clerkId: newUser.clerkId,
      });
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
          avatar: clerkData.image_url || "", // Ensure we're storing the avatar URL
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Voter updated: ${updatedVoter.id}`, {
        avatar: updatedVoter.avatar,
        clerkId: updatedVoter.clerkId,
      });
      return updatedVoter;
    } else {
      // Try to find the voter by email to get existing data
      const existingVoterByEmail = await prisma.voter.findUnique({
        where: { email },
      });

      if (existingVoterByEmail) {
        // Update the existing voter with Clerk ID
        const updatedVoter = await prisma.voter.update({
          where: { email },
          data: {
            clerkId: clerkData.id,
            firstName: clerkData.first_name || existingVoterByEmail.firstName,
            lastName: clerkData.last_name || existingVoterByEmail.lastName,
            avatar: clerkData.image_url || existingVoterByEmail.avatar || "", // Ensure we're storing the avatar URL
            updatedAt: new Date(),
          },
        });
        console.log(`✅ Voter linked with Clerk ID: ${updatedVoter.id}`, {
          avatar: updatedVoter.avatar,
          clerkId: updatedVoter.clerkId,
        });
        return updatedVoter;
      } else {
        // FOR DEVELOPMENT: Create a new voter if not found
        // In production, you might want to throw an error instead
        console.log(
          `⚠️ Voter not found by email, creating new voter for ${email}`
        );

        // Generate a default password
        const defaultPassword = "voter123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Get a default election and year for the voter
        const defaultElection = await prisma.election.findFirst();
        const defaultYear = await prisma.year.findFirst();

        if (!defaultElection || !defaultYear) {
          throw new Error("No election or year found to assign voter to");
        }

        const newVoter = await prisma.voter.create({
          data: {
            clerkId: clerkData.id,
            email,
            firstName: clerkData.first_name || email.split("@")[0],
            lastName: clerkData.last_name || "",
            middleName: "", // Required field
            avatar: clerkData.image_url || "", // Ensure we're storing the avatar URL
            hashpassword: hashedPassword,
            electionId: defaultElection.id,
            yearId: defaultYear.id,
            status: "UNCAST", // Use the correct enum value
          },
        });
        console.log(`✅ New voter created: ${newVoter.id}`, {
          avatar: newVoter.avatar,
          clerkId: newVoter.clerkId,
        });
        return newVoter;
      }
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
    // First, find the voter to get their ID
    const voter = await prisma.voter.findUnique({
      where: { clerkId },
    });

    if (voter) {
      // First delete any votes associated with this voter to avoid foreign key constraint violation
      await prisma.vote.deleteMany({
        where: { voterId: voter.id },
      });

      // Then delete the voter
      await prisma.voter.delete({
        where: { clerkId },
      });

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
    console.log(`🔍 Looking up user by Clerk ID: ${clerkId}`);

    // Try to find admin user
    const adminUser = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        elections: true,
      },
    });

    if (adminUser) {
      console.log(`✅ Admin user found by Clerk ID: ${clerkId}`);
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
      console.log(`✅ Voter found by Clerk ID: ${clerkId}`);
      return { type: "voter", user: voter };
    }

    console.log(`❌ No user found by Clerk ID: ${clerkId}`);
    return null;
  } catch (error) {
    console.error("Error getting user by Clerk ID:", error);
    return null;
  }
}
