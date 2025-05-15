import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const years = await prisma.year.findMany({
      include: {
        department: true,
      },
      orderBy: { name: "asc" },
    });

    // Transform the data to match the expected format in the frontend
    const transformedYears = years.map((year) => ({
      id: year.id.toString(),
      name: year.name,
      departmentId: year.departmentId.toString(),
      departmentName: year.department.name,
    }));

    return NextResponse.json(transformedYears);
  } catch (error) {
    console.error("Error fetching years:", error);
    return NextResponse.json(
      { message: "Failed to fetch years" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const year = await prisma.year.create({
      data: {
        name: body.name,
        departmentId: parseInt(body.departmentId),
      },
      include: {
        department: true,
      },
    });

    // Transform to match frontend expected format
    const transformedYear = {
      id: year.id.toString(),
      name: year.name,
      departmentId: year.departmentId.toString(),
      departmentName: year.department.name,
    };

    return NextResponse.json(transformedYear);
  } catch (error) {
    console.error("Error creating year:", error);
    return NextResponse.json(
      { message: "Failed to create year" },
      { status: 500 }
    );
  }
}
