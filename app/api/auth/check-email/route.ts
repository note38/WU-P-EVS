import { NextRequest, NextResponse } from "next/server";
import { checkUserExists } from "@/lib/clerk-auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      console.log("❌ No email provided in request");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log(`🔍 Checking email: ${email}`);

    // Check if user exists in database
    const userType = await checkUserExists(email);

    if (!userType) {
      console.log(`❌ Email ${email} not found in database`);
      return NextResponse.json(
        {
          allowed: false,
          message:
            "Email not found in our database. Please contact an administrator.",
        },
        { status: 403 }
      );
    }

    console.log(`✅ Email ${email} found as ${userType}`);

    return NextResponse.json({
      allowed: true,
      userType,
      message: `User found as ${userType}`,
    });
  } catch (error) {
    console.error("❌ Error checking email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
