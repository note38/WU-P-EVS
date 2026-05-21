import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const { departmentId: departmentIdParam } = await params;
    const departmentId = parseInt(departmentIdParam);

    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: "Invalid department ID" },
        { status: 400 }
      );
    }

    const programs = await prisma.program.findMany({
      where: {
        departmentId: departmentId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error fetching programs by department:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}
