import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    const { programId: programIdParam } = await params;
    const programId = parseInt(programIdParam);

    if (isNaN(programId)) {
      return NextResponse.json(
        { error: "Invalid program ID" },
        { status: 400 }
      );
    }

    const years = await prisma.year.findMany({
      where: {
        programId: programId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(years);
  } catch (error) {
    console.error("Error fetching years by program:", error);
    return NextResponse.json(
      { error: "Failed to fetch years" },
      { status: 500 }
    );
  }
}
