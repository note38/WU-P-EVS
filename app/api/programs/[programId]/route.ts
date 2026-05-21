import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const id = parseInt(programId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid program ID" },
        { status: 400 },
      );
    }
    const program = await prisma.program.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    return NextResponse.json(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    return NextResponse.json(
      { error: "Failed to fetch program" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const id = parseInt(programId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid program ID" },
        { status: 400 },
      );
    }
    const body = await request.json();
    const updateData: { name: string; departmentId?: number } = {
      name: body.name,
    };
    if (
      body.departmentId !== undefined &&
      body.departmentId !== null &&
      body.departmentId !== ""
    ) {
      const deptId = parseInt(body.departmentId);
      if (!isNaN(deptId)) updateData.departmentId = deptId;
    }
    const updated = await prisma.program.update({
      where: { id },
      data: updateData,
      include: { department: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating program:", error);
    return NextResponse.json(
      { error: "Failed to update program" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const id = parseInt(programId);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid program ID" },
        { status: 400 },
      );
    }

    // Get all years under this program
    const years = await prisma.year.findMany({
      where: { programId: id },
      select: { id: true },
    });
    const yearIds = years.map((y) => y.id);

    if (yearIds.length > 0) {
      // Delete dependent records first
      await prisma.vote.deleteMany({
        where: { voter: { yearId: { in: yearIds } } },
      });
      await prisma.voter.deleteMany({ where: { yearId: { in: yearIds } } });
      await prisma.candidate.deleteMany({ where: { yearId: { in: yearIds } } });
      await prisma.position.deleteMany({ where: { yearId: { in: yearIds } } });
      await prisma.year.deleteMany({ where: { id: { in: yearIds } } });
    }

    await prisma.program.delete({ where: { id } });

    return NextResponse.json({ message: "Program deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting program:", error);
    return NextResponse.json(
      { message: "Failed to delete program" },
      { status: 500 },
    );
  }
}
