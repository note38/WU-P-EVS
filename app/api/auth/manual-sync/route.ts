import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkUserExists, syncAdminUser, syncVoter } from "@/lib/clerk-auth";
import { setUserRole } from "@/lib/clerk-config";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      console.log("❌ No userId found in auth");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔄 Manual sync for user: ${userId}`);

    // Get user data from Clerk
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();

    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(userId);
    } catch (error) {
      console.error(`❌ Error fetching user ${userId} from Clerk:`, error);
      // Don't return error for auto-sync, just log it
      return NextResponse.json({ success: true, message: "Sync completed" });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error(`❌ No email address found for user ${userId}`);
      // Don't return error for auto-sync, just log it
      return NextResponse.json({ success: true, message: "Sync completed" });
    }

    console.log(`📧 Checking user existence for email: ${email}`);

    // Check if user exists in our database
    const userType = await checkUserExists(email);

    if (!userType) {
      console.error(`❌ User with email ${email} not found in database`);
      // Don't return error for auto-sync, just log it
      return NextResponse.json({ success: true, message: "Sync completed" });
    }

    console.log(`✅ User found as ${userType}, proceeding with sync`);

    // Sync user data based on type
    if (userType === "admin") {
      await syncAdminUser({
        id: userId,
        email_addresses: [
          {
            email_address: email,
            id: clerkUser.emailAddresses[0]?.id || "",
            linked_to: [],
            object: "email_address",
            verification: null,
          },
        ],
        first_name: clerkUser.firstName || "",
        last_name: clerkUser.lastName || "",
        username: clerkUser.username || email.split("@")[0],
        image_url: clerkUser.imageUrl || "", // Ensure we're passing the image URL
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      try {
        // Only set role if it's not already set correctly
        await setUserRole(userId, "admin");
        console.log("✅ Admin user synced and role set successfully");
      } catch (roleError) {
        console.error(
          "⚠️ Error setting admin role, but user synced:",
          roleError
        );
      }
    } else if (userType === "voter") {
      await syncVoter({
        id: userId,
        email_addresses: [
          {
            email_address: email,
            id: clerkUser.emailAddresses[0]?.id || "",
            linked_to: [],
            object: "email_address",
            verification: null,
          },
        ],
        first_name: clerkUser.firstName || "",
        last_name: clerkUser.lastName || "",
        username: clerkUser.username || email.split("@")[0],
        image_url: clerkUser.imageUrl || "", // Ensure we're passing the image URL
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      try {
        // Only set role if it's not already set correctly
        await setUserRole(userId, "voter");
        console.log("✅ Voter synced and role set successfully");
      } catch (roleError) {
        console.error(
          "⚠️ Error setting voter role, but user synced:",
          roleError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sync completed",
    });
  } catch (error) {
    console.error("❌ Error in manual sync:", error);
    // Don't return error for auto-sync, just log it
    return NextResponse.json({ success: true, message: "Sync completed" });
  }
}
