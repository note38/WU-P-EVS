import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const year = await prisma.year.update({
      where: { id: parseInt(params.id) },
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
    console.error("Error updating year:", error);
    return NextResponse.json(
      { message: "Failed to update year" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.year.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Year deleted successfully" });
  } catch (error) {
    console.error("Error deleting year:", error);
    return NextResponse.json(
      { message: "Failed to delete year" },
      { status: 500 }
    );
  }
}
