import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/clerk-auth";

// GET all users - only for admins
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Users API GET called");
    const { userId } = await auth();

    if (!userId) {
      console.log("❌ No userId found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("👤 Checking user permissions for:", userId);

    // Get user data from database to check if they're an admin
    const userData = await getUserByClerkId(userId);

    if (!userData) {
      console.log("❌ User not found in database");
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log(
      "✅ User found, type:",
      userData.type,
      "role:",
      userData.user.role
    );

    if (userData.type !== "admin" || userData.user.role !== "ADMIN") {
      console.log("❌ User is not admin");
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const includeAvatar = searchParams.get("include") === "avatar";

    // Build where clause
    const whereClause: any = {};
    if (role) {
      whereClause.role = role;
    }

    // Build select clause
    const selectClause: any = {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    };

    if (includeAvatar) {
      selectClause.avatar = true;
    }

    console.log("📊 Fetching users with filters:", { role, includeAvatar });

    const users = await prisma.user.findMany({
      where: whereClause,
      select: selectClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("✅ Found", users.length, "users");
    return NextResponse.json(users);
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Create a new user - only for admins
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from database to check if they're an admin
    const userData = await getUserByClerkId(userId);

    if (!userData) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    if (userData.type !== "admin" || userData.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.username || !data.email || !data.role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    // Generate default password if not provided
    const defaultPassword = data.password || "Admin123!";

    // Hash password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
