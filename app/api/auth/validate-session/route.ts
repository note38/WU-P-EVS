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
    if (!userData) {
      console.log(
        `⚠️ User ${userId} not found by Clerk ID, trying email lookup...`
      );

      try {
        // Get user data from Clerk
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (email) {
          console.log(`📧 Checking user existence for email: ${email}`);

          // Check if user exists in database by email
          const userType = await checkUserExists(email);

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

              if (adminUser) {
                await prisma.user.update({
                  where: { id: adminUser.id },
                  data: { clerkId: userId },
                });

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

              if (voter) {
                await prisma.voter.update({
                  where: { id: voter.id },
                  data: { clerkId: userId },
                });

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

    if (!userData) {
      console.log(`❌ User ${userId} not found in database`);

      // Check if this is a redirect request (coming from sign-in)
      const url = new URL(req.url);
      const isRedirect = url.searchParams.get("redirect") !== "false";

      if (isRedirect) {
        // Redirect to home page for users not in database
        console.log(
          `🔀 Redirecting user ${userId} to home page (not in database)`
        );
        return NextResponse.redirect(new URL("/home", req.url));
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
      // Redirect based on user type
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
