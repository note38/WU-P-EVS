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
  if (!userId) {
    return {
      success: false,
      userType: null,
      message: "No user ID provided",
    };
  }

  try {
    const { getUserByClerkId } = await import("@/lib/clerk-auth");
    const userData = await getUserByClerkId(userId);

    if (userData) {
      return {
        success: true,
        userType: userData.type,
        user: userData.user,
      };
    } else {
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
