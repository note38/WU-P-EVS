import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, checkUserExists } from "@/lib/clerk-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.log("❌ No userId found in auth");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔍 Validating session for user: ${userId}`);

    // First, try to get user data by Clerk ID
    let userData = await getUserByClerkId(userId);

    // If not found by Clerk ID, try to get user data from Clerk and check by email
    console.log(
      `🔍 Checking if we should perform email lookup. userData is:`,
      userData
    );
    if (!userData) {
      console.log(
        `⚠️ User ${userId} not found by Clerk ID, trying email lookup...`
      );

      try {
        console.log(`🔍 Entering email lookup try block`);
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
        console.log(`📧 Email extracted from Clerk user: ${email}`);
        if (email) {
          console.log(`📧 Checking user existence for email: ${email}`);

          // Check if user exists in database by email
          const userType = await checkUserExists(email);
          console.log(`📊 Email lookup result for ${email}:`, userType);

          console.log(`📧 User type found: ${userType}`);
          if (userType) {
            console.log(
              `✅ User found by email as ${userType}, linking Clerk ID...`
            );

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
        // Re-throw the error so it can be handled properly
        throw clerkError;
      }
    }

    if (!userData) {
      console.log(`❌ User ${userId} not found in database`);

      // Check if this is a redirect request (coming from sign-in)
      const url = new URL(req.url);
      const isRedirect = url.searchParams.get("redirect") !== "false";

      if (isRedirect) {
        // Instead of redirecting to home, redirect back to sign-in with error
        console.log(
          `🔀 Redirecting user ${userId} back to sign-in (not in database)`
        );
        // Sign out the user from Clerk first to clear the session
        const signOutUrl = new URL("/sign-in", req.url);
        signOutUrl.searchParams.set("error", "email_not_registered");
        signOutUrl.searchParams.set(
          "message",
          "This email is not registered in our system. Please try with a different email."
        );
        return NextResponse.redirect(signOutUrl);
      }

      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log(`✅ User ${userId} validated as ${userData.type}`);

    // Return user role and type for frontend routing
    const responseData: any = {
      userType: userData.type,
      role: userData.user.role,
      userId: userData.user.id,
    };

    // Include additional data based on user type
    if (userData.type === "admin") {
      responseData.username = (userData.user as any).username;
      responseData.avatar = (userData.user as any).avatar;
    } else if (userData.type === "voter") {
      responseData.firstName = (userData.user as any).firstName;
      responseData.lastName = (userData.user as any).lastName;
      responseData.status = (userData.user as any).status;
      responseData.electionId = (userData.user as any).electionId;
    }

    // Check if this is a redirect request (coming from sign-in)
    const url = new URL(req.url);
    const isRedirect = url.searchParams.get("redirect") !== "false";

    if (isRedirect) {
      // Check if there's an intended redirect URL in the referrer
      const referer = req.headers.get("referer");
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          // Check if referer has a redirect_url parameter
          const redirectParam = refererUrl.searchParams.get("redirect_url");
          if (redirectParam) {
            // Decode and validate the redirect URL
            const decodedRedirectUrl = decodeURIComponent(redirectParam);
            const redirectUrl = new URL(decodedRedirectUrl, req.url);

            // Only redirect to URLs on the same origin
            if (redirectUrl.origin === new URL(req.url).origin) {
              console.log(
                "🔀 Redirecting to intended URL:",
                redirectUrl.pathname
              );
              return NextResponse.redirect(redirectUrl);
            }
          }
        } catch (e) {
          console.error("Error parsing referer redirect URL:", e);
        }
      }

      // Default redirects based on user type
      if (userData.type === "admin") {
        return NextResponse.redirect(new URL("/admin_dashboard", req.url));
      } else if (userData.type === "voter") {
        return NextResponse.redirect(new URL("/ballot", req.url));
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Session validation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
