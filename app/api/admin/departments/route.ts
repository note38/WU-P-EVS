import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Check if we're in a build environment
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database not available during build" },
        { status: 503 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get departments with programs and years
    const departments = await prisma.department.findMany({
      include: {
        programs: {
          include: {
            years: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Map to preserve the legacy { years: Year[] } structure for frontend compatibility
    const mappedDepartments = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      image: dept.image,
      years: dept.programs.flatMap((prog) =>
        prog.years.map((y) => ({
          id: y.id,
          name: `${prog.name} - ${y.name}`,
        }))
      ),
    }));

    return NextResponse.json(mappedDepartments);
  } catch (error) {
    console.error("❌ Error fetching departments:", error);
    
    // Handle specific database connection errors
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
