import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log(`🔍 Checking if user exists in Clerk: ${email}`);

    // Check if user exists in Clerk
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    const exists = users.length > 0;

    console.log(
      `✅ User ${email} ${exists ? "exists" : "does not exist"} in Clerk`
    );

    return NextResponse.json({
      exists,
      message: exists ? "User found in Clerk" : "User not found in Clerk",
    });
  } catch (error) {
    console.error("❌ Error checking user in Clerk:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

