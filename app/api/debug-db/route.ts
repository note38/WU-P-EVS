import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const departments = await prisma.department.findMany();
    const programs = await prisma.program.findMany({
      include: { department: true }
    });
    const years = await prisma.year.findMany({
      include: {
        program: {
          include: { department: true }
        }
      }
    });

    return NextResponse.json({
      departments,
      programs,
      years,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || error }, { status: 500 });
  }
}
