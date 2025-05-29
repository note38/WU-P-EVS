import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, context: any) {
  try {
    const body = await request.json();
    const params = await context.params;

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { message: "Department name is required" },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: { id: parseInt(params.id) },
      data: {
        name: body.name,
        image: body.image !== undefined ? body.image : undefined,
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
    const params = await context.params;
    const { id } = params;
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
