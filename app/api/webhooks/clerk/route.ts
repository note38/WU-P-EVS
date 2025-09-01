import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import {
  checkUserExists,
  syncAdminUser,
  syncVoter,
  deleteUser,
  type ClerkUserData,
  type ClerkDeletedData,
} from "@/lib/clerk-auth";
import { setUserRole } from "@/lib/clerk-config";

// Initialize Clerk client properly
const clerk = clerkClient();

export async function POST(req: NextRequest) {
  try {
    // Verify the webhook signature
    const evt = await verifyWebhook(req);

    // Extract event information
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`✅ Webhook verified successfully`);
    console.log(`📋 Event ID: ${id}`);
    console.log(`🎯 Event Type: ${eventType}`);
    console.log(`📦 Payload:`, JSON.stringify(evt.data, null, 2));

    // Handle different event types
    switch (eventType) {
      case "user.created":
        console.log("👤 New user created:", evt.data);
        await handleUserCreated(evt.data as ClerkUserData);
        break;

      case "user.updated":
        console.log("🔄 User updated:", evt.data);
        await handleUserUpdated(evt.data as ClerkUserData);
        break;

      case "user.deleted":
        console.log("🗑️ User deleted:", evt.data);
        await handleUserDeleted(evt.data as ClerkDeletedData);
        break;

      case "session.created":
        console.log("🔐 Session created:", evt.data);
        await handleSessionCreated(evt.data);
        break;

      case "session.revoked":
        console.log("🚫 Session revoked:", evt.data);
        // Handle session revocation if needed
        break;

      default:
        console.log(`📝 Unhandled event type: ${eventType}`);
    }

    // Return 200 to acknowledge successful processing
    return new Response("Webhook processed successfully", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);

    // Return 400 for verification errors
    return new Response("Webhook verification failed", {
      status: 400,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}

async function handleUserCreated(clerkData: ClerkUserData) {
  try {
    const email = clerkData.email_addresses[0]?.email_address;
    if (!email) {
      console.error("❌ No email address found in Clerk data");
      // Delete the unauthorized user
      const clerk = await clerkClient();
      await clerk.users.deleteUser(clerkData.id);
      return;
    }

    // Check if user exists in our database
    const userType = await checkUserExists(email);

    if (!userType) {
      console.error(
        `❌ User with email ${email} not found in database. Deleting unauthorized user.`
      );
      // Delete the unauthorized user from Clerk
      const clerk = await clerkClient();
      await clerk.users.deleteUser(clerkData.id);
      return;
    }

    console.log(`✅ User found in database as ${userType}`);

    // Sync user data based on type
    if (userType === "admin") {
      await syncAdminUser(clerkData);
      // Set admin role in Clerk
      await setUserRole(clerkData.id, "admin");
      console.log("✅ Admin user synced and role set successfully");
    } else if (userType === "voter") {
      await syncVoter(clerkData);
      // Set voter role in Clerk
      await setUserRole(clerkData.id, "voter");
      console.log("✅ Voter synced and role set successfully");
    }
  } catch (error) {
    console.error("❌ Error handling user creation:", error);
    // If there's an error, delete the user to prevent unauthorized access
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(clerkData.id);
      console.log("🗑️ Deleted user due to error during creation");
    } catch (deleteError) {
      console.error("❌ Error deleting user:", deleteError);
    }
  }
}

async function handleUserUpdated(clerkData: ClerkUserData) {
  try {
    const email = clerkData.email_addresses[0]?.email_address;
    if (!email) {
      console.error("❌ No email address found in Clerk data");
      return;
    }

    // Check if user exists in our database
    const userType = await checkUserExists(email);

    if (!userType) {
      console.error(
        `❌ User with email ${email} not found in database. Update skipped.`
      );
      return;
    }

    // Sync user data based on type
    if (userType === "admin") {
      await syncAdminUser(clerkData);
      // Update admin role in Clerk
      await setUserRole(clerkData.id, "admin");
      console.log("✅ Admin user updated and role set successfully");
    } else if (userType === "voter") {
      await syncVoter(clerkData);
      // Update voter role in Clerk
      await setUserRole(clerkData.id, "voter");
      console.log("✅ Voter updated and role set successfully");
    }
  } catch (error) {
    console.error("❌ Error handling user update:", error);
  }
}

async function handleUserDeleted(clerkData: ClerkDeletedData) {
  try {
    const result = await deleteUser(clerkData.id);
    if (result.success) {
      console.log(`✅ ${result.type} user deleted successfully`);
    } else {
      console.log("⚠️ User not found in database for deletion");
    }
  } catch (error) {
    console.error("❌ Error handling user deletion:", error);
  }
}

async function handleSessionCreated(sessionData: any) {
  try {
    // You can add session-specific logic here if needed
    console.log("✅ Session created successfully");
  } catch (error) {
    console.error("❌ Error handling session creation:", error);
  }
}

// Handle unsupported HTTP methods
export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}

export async function PUT() {
  return new Response("Method not allowed", { status: 405 });
}

export async function DELETE() {
  return new Response("Method not allowed", { status: 405 });
}
