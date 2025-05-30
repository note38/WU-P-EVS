import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const years = await prisma.year.findMany({
      include: {
        department: true,
      },
      orderBy: [
        {
          department: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json(years);
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

    return NextResponse.json(year);
  } catch (error) {
    console.error("Error creating year:", error);
    return NextResponse.json(
      { message: "Failed to create year" },
      { status: 500 }
    );
  }
}
