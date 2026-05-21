// app/api/elections/[electionId]/positions/[positionId]/route.ts
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { validateAdminAccess } from "@/lib/auth-utils";

// GET /api/elections/[electionId]/positions/[positionId]
export async function GET(req: NextRequest, context: any) {
  try {
    const authResult = await validateAdminAccess();
    if (!authResult.success) {
      return authResult.response;
    }

    const params = await context.params;

    if (!params?.electionId || !params?.positionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const electionId = parseInt(params.electionId);
    const positionId = parseInt(params.positionId);

    if (isNaN(electionId) || isNaN(positionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const position = await prisma.position.findUnique({
      where: { id: positionId, electionId },
      include: {
        _count: {
          select: { candidates: true },
        },
        year: {
          include: {
            program: {
              include: {
                department: true,
              },
            },
          },
        },
        program: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 },
      );
    }

    // ✅ Null-safe nested access (same fix as GET /positions)
    const formattedPosition = {
      id: position.id,
      name: position.name,
      maxCandidates: position.maxCandidates,
      candidates: position._count.candidates,
      yearId: position.yearId,
      programId: position.programId,
      year: position.year
        ? {
            id: position.year.id,
            name: position.year.name,
            department: position.year.program?.department
              ? {
                  id: position.year.program.department.id,
                  name: position.year.program.department.name,
                }
              : { id: 0, name: "Unassigned" },
          }
        : null,
      program: position.program
        ? {
            id: position.program.id,
            name: position.program.name,
            department: position.program.department
              ? {
                  id: position.program.department.id,
                  name: position.program.department.name,
                }
              : { id: 0, name: "Unassigned" },
          }
        : null,
    };

    return NextResponse.json(formattedPosition);
  } catch (error) {
    console.error("Error fetching position:", error);
    return NextResponse.json(
      { error: "Failed to fetch position" },
      { status: 500 },
    );
  }
}

// PUT /api/elections/[electionId]/positions/[positionId]
export async function PUT(req: NextRequest, context: any) {
  try {
    const authResult = await validateAdminAccess();
    if (!authResult.success) {
      return authResult.response;
    }

    const params = await context.params;

    if (!params?.electionId || !params?.positionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const electionId = parseInt(params.electionId);
    const positionId = parseInt(params.positionId);

    if (isNaN(electionId) || isNaN(positionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const { name, maxCandidates, yearId, programId } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Position name is required" },
        { status: 400 },
      );
    }

    if (!maxCandidates || maxCandidates < 1) {
      return NextResponse.json(
        { error: "Maximum candidates must be at least 1" },
        { status: 400 },
      );
    }

    const existingPosition = await prisma.position.findUnique({
      where: { id: positionId, electionId },
    });

    if (!existingPosition) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 },
      );
    }

    // ✅ Validate yearId exists if provided
    if (yearId) {
      const year = await prisma.year.findUnique({ where: { id: yearId } });
      if (!year) {
        return NextResponse.json(
          { error: "Selected year level does not exist" },
          { status: 400 },
        );
      }
    }

    // ✅ Validate programId exists if provided
    if (programId) {
      const program = await prisma.program.findUnique({
        where: { id: programId },
      });
      if (!program) {
        return NextResponse.json(
          { error: "Selected program does not exist" },
          { status: 400 },
        );
      }
    }

    const updatedPosition = await prisma.position.update({
      where: { id: positionId },
      data: {
        name: name.trim(),
        maxCandidates,
        yearId: yearId || null,
        programId: programId || null,
      },
    });

    return NextResponse.json(updatedPosition);
  } catch (error) {
    console.error("Error updating position:", error);
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 },
    );
  }
}

// DELETE /api/elections/[electionId]/positions/[positionId]
export async function DELETE(req: NextRequest, context: any) {
  try {
    const authResult = await validateAdminAccess();
    if (!authResult.success) {
      return authResult.response;
    }

    const params = await context.params;

    if (!params?.electionId || !params?.positionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const electionId = parseInt(params.electionId);
    const positionId = parseInt(params.positionId);

    if (isNaN(electionId) || isNaN(positionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const position = await prisma.position.findUnique({
      where: { id: positionId, electionId },
      include: {
        _count: { select: { candidates: true } },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 },
      );
    }

    // ✅ Cascade delete: remove candidates and their votes first,
    // then votes on this position, then the position itself
    if (position._count.candidates > 0) {
      // Delete votes tied to candidates of this position
      await prisma.vote.deleteMany({
        where: { positionId },
      });

      // Delete all candidates under this position
      await prisma.candidate.deleteMany({
        where: { positionId },
      });
    }

    // Delete any remaining votes directly on this position
    await prisma.vote.deleteMany({
      where: { positionId },
    });

    await prisma.position.delete({
      where: { id: positionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting position:", error);
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 },
    );
  }
}
