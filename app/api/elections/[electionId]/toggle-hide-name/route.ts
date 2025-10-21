import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAdminAccess } from "@/lib/auth-utils";

export async function POST(req: NextRequest, context: any) {
  try {
    // Validate admin access
    const adminValidation = await validateAdminAccess();
    if (!adminValidation.success) {
      return adminValidation.response;
    }

    const params = await context.params;
    const electionId = parseInt(params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID format" },
        { status: 400 }
      );
    }

    // Check if election exists
    const existingElection = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!existingElection) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Toggle the hideName field
    const updatedElection = await prisma.election.update({
      where: { id: electionId },
      data: {
        hideName: !existingElection.hideName,
      },
    });

    return NextResponse.json({
      message: "Election hide name status updated successfully",
      hideName: updatedElection.hideName,
    });
  } catch (error) {
    console.error("Error toggling hide name status:", error);
    return NextResponse.json(
      { error: "Failed to update election hide name status" },
      { status: 500 }
    );
  }
}