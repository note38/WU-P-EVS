"use server";

import { compare } from "bcrypt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

interface LoginFormData {
  email: string;
  password: string;
}

export async function voterLogin(formData: LoginFormData) {
  try {
    const voter = await prisma.voter.findUnique({
      where: {
        email: formData.email,
      },
      include: {
        election: true,
      },
    });

    if (!voter) {
      return { success: false, message: "Invalid email or password" };
    }

    // Check if the election is active
    if (voter.election?.status !== "ACTIVE") {
      return {
        success: false,
        message: "The election you are registered for is not currently active",
      };
    }

    // Check if the voter has already voted
    if (voter.status === "CAST") {
      return {
        success: false,
        message: "You have already voted in this election",
      };
    }

    // Verify password
    if (!voter.hashpassword) {
      return { success: false, message: "Invalid email or password" };
    }
    const passwordValid = await compare(formData.password, voter.hashpassword);
    if (!passwordValid) {
      return { success: false, message: "Invalid email or password" };
    }

    // Set voter session cookie
    const oneDay = 24 * 60 * 60 * 1000;
    const cookieStore = await cookies();
    cookieStore.set("voter_session", String(voter.id), {
      expires: new Date(Date.now() + oneDay),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    cookieStore.set("election_id", String(voter.electionId), {
      expires: new Date(Date.now() + oneDay),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return { success: true, voterId: voter.id };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "An error occurred during login" };
  }
}

export async function getVoterSession() {
  const cookieStore = cookies();
  const voterId = (await cookieStore).get("voter_session")?.value;
  const electionId = (await cookieStore).get("election_id")?.value;

  if (!voterId || !electionId) {
    return null;
  }

  try {
    const voter = await prisma.voter.findUnique({
      where: {
        id: Number(voterId),
        electionId: Number(electionId),
      },
      include: {
        election: true,
      },
    });

    if (
      !voter ||
      voter.status === "CAST" ||
      voter.election?.status !== "ACTIVE"
    ) {
      // Clear cookies if voter is not valid, has voted, or election is not active
      (await cookieStore).delete("voter_session");
      (await cookieStore).delete("election_id");
      return null;
    }

    return {
      id: String(voter.id),
      name: `${voter.firstName} ${voter.lastName}`,
      electionId: String(voter.electionId),
    };
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}

export async function logoutVoter() {
  const cookieStore = await cookies();
  cookieStore.delete("voter_session");
  cookieStore.delete("election_id");
  redirect("/");
}

export async function checkUserRole(userId: string | null) {
  console.log(`🔍 checkUserRole called with userId: ${userId}`);

  if (!userId) {
    console.log("❌ No user ID provided to checkUserRole");
    return {
      success: false,
      userType: null,
      message: "No user ID provided",
    };
  }

  try {
    const { getUserByClerkId, checkUserExists } = await import(
      "@/lib/clerk-auth"
    );
    let userData = await getUserByClerkId(userId);

    console.log(`📊 getUserByClerkId result for ${userId}:`, userData);

    // If not found by Clerk ID, try to get user data from Clerk and check by email
    if (!userData) {
      console.log(
        `⚠️ User ${userId} not found by Clerk ID, trying email lookup...`
      );

      try {
        // Get user data from Clerk
        console.log(`🔍 Attempting to get Clerk user data for: ${userId}`);
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        console.log(
          `📊 Clerk user data retrieved:`,
          clerkUser?.emailAddresses?.[0]?.emailAddress
        );

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (email) {
          console.log(`📧 Checking user existence for email: ${email}`);

          // Check if user exists in database by email
          const userType = await checkUserExists(email);
          console.log(`📊 Email lookup result for ${email}:`, userType);

          if (userType) {
            console.log(
              `✅ User found by email as ${userType}, linking Clerk ID...`
            );

            const { prisma } = await import("@/lib/db");

            // Link the Clerk ID to the existing user
            if (userType === "admin") {
              const adminUser = await prisma.user.findUnique({
                where: { email },
                include: {
                  elections: true,
                },
              });
              console.log(`📧 Checking if admin user exists:`, adminUser);

              if (adminUser) {
                console.log(
                  `🔗 Linking Clerk ID ${userId} to admin user ${adminUser.id}`
                );
                await prisma.user.update({
                  where: { id: adminUser.id },
                  data: { clerkId: userId },
                });
                console.log(`✅ Successfully linked Clerk ID to admin user`);

                userData = {
                  type: "admin",
                  user: { ...adminUser, clerkId: userId },
                };
              }
            } else if (userType === "voter") {
              const voter = await prisma.voter.findUnique({
                where: { email },
                include: {
                  election: true,
                  year: true,
                },
              });
              console.log(`📧 Checking if voter exists:`, voter);

              if (voter) {
                console.log(
                  `🔗 Linking Clerk ID ${userId} to voter ${voter.id}`
                );
                await prisma.voter.update({
                  where: { id: voter.id },
                  data: { clerkId: userId },
                });
                console.log(`✅ Successfully linked Clerk ID to voter`);

                userData = {
                  type: "voter",
                  user: { ...voter, clerkId: userId },
                };
              }
            }
          }
        }
      } catch (clerkError) {
        console.error("❌ Error getting Clerk user data:", clerkError);
      }
    }

    if (userData) {
      return {
        success: true,
        userType: userData.type,
        user: userData.user,
      };
    } else {
      console.log(`⚠️ User ${userId} not found in database`);
      return {
        success: false,
        userType: null,
        message: "User not found in database",
      };
    }
  } catch (error) {
    console.error("Error checking user role:", error);
    return {
      success: false,
      userType: null,
      message: "Error checking user role",
    };
  }
}
