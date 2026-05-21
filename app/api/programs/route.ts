import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      include: { department: true },
      orderBy: [{ name: "asc" }],
    });
    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json({ message: "Failed to fetch programs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const program = await prisma.program.create({
      data: {
        name: body.name,
        departmentId: parseInt(body.departmentId),
      },
    });
    return NextResponse.json(program);
  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json({ message: "Failed to create program" }, { status: 500 });
  }
}
