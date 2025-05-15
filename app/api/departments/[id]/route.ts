import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const department = await prisma.department.update({
      where: { id: parseInt(params.id) },
      data: {
        name: body.name,
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { message: "Failed to update department" },
      { status: 500 }
    );
  }
}

// Use any type to bypass type checking for the route handler
export async function DELETE(request: Request, context: any) {
  try {
    const { id } = context.params;
    await prisma.department.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { message: "Failed to delete department" },
      { status: 500 }
    );
  }
}
