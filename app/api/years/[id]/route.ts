import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function PATCH(request: Request, context: any) {
  try {
    const body = await request.json();
    const params = await context.params;
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

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    await prisma.year.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Year deleted successfully" });
  } catch (error) {
    console.error("Error deleting year:", error);

    // Check for specific error types
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Foreign key constraint violation
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            message:
              "Cannot delete this year because it has associated records",
            details:
              "Please remove all voters and candidates assigned to this year first",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to delete year" },
      { status: 500 }
    );
  }
}
