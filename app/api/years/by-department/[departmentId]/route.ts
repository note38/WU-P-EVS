import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

        const years = await prisma.year.findMany({
      where: {
        program: {
          departmentId: departmentId,
        },
      },
      include: {
        program: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const mappedYears = years.map((year) => ({
      id: year.id,
      name: year.name,
      programId: year.programId,
      departmentId: year.program.departmentId,
      program: year.program,
      department: year.program.department,
    }));

    return NextResponse.json(mappedYears);
  } catch (error) {
    console.error("Error fetching years by department:", error);
    return NextResponse.json(
      { error: "Failed to fetch years" },
      { status: 500 }
    );
  }
}
