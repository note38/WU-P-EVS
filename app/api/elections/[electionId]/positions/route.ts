import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/elections/[electionId]/positions
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ electionId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;

    if (!params || !params.electionId) {
      return NextResponse.json(
        { error: "Missing election ID" },
        { status: 400 },
      );
    }

    const electionId = parseInt(params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID format" },
        { status: 400 },
      );
    }

    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 },
      );
    }

    // ── Step 1: fetch without any includes to isolate the problem ──
    const rawPositions = await prisma.position.findMany({
      where: { electionId },
      orderBy: { createdAt: "asc" },
    });

    // ── Step 2: try adding _count ──
    const positionsWithCount = await prisma.position.findMany({
      where: { electionId },
      include: {
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // ── Step 3: try adding program (the newly added model) ──
    const positionsWithProgram = await prisma.position.findMany({
      where: { electionId },
      include: {
        _count: { select: { candidates: true } },
        program: {
          include: {
            department: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // ── Step 4: full query ──
    const positions = await prisma.position.findMany({
      where: { electionId },
      include: {
        _count: { select: { candidates: true } },
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
      orderBy: { createdAt: "asc" },
    });

    const formattedPositions = positions.map((position) => ({
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
    }));

    return NextResponse.json(formattedPositions);
  } catch (error: any) {
    // ✅ Log the FULL error details so we can see exactly what's failing
    console.error("=== POSITION FETCH ERROR ===");
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Meta:", error?.meta);
    console.error("Stack:", error?.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));
    console.error("============================");

    return NextResponse.json(
      {
        error: "Failed to fetch positions",
        // ✅ Temporarily expose the real error message in the response
        detail: error?.message || "Unknown error",
        code: error?.code,
        meta: error?.meta,
      },
      { status: 500 },
    );
  }
}

// POST /api/elections/[electionId]/positions
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ electionId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;

    if (!params || !params.electionId) {
      return NextResponse.json(
        { error: "Missing election ID" },
        { status: 400 },
      );
    }

    const electionId = parseInt(params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID format" },
        { status: 400 },
      );
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

    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 },
      );
    }

    if (yearId) {
      const year = await prisma.year.findUnique({ where: { id: yearId } });
      if (!year) {
        return NextResponse.json(
          { error: "Selected year level does not exist" },
          { status: 400 },
        );
      }
    }

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

    const position = await prisma.position.create({
      data: {
        name: name.trim(),
        maxCandidates,
        electionId,
        yearId: yearId || null,
        programId: programId || null,
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error: any) {
    console.error("=== POSITION CREATE ERROR ===");
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Meta:", error?.meta);
    console.error("Stack:", error?.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));
    console.error("=============================");

    return NextResponse.json(
      {
        error: "Failed to create position",
        detail: error?.message || "Unknown error",
        code: error?.code,
        meta: error?.meta,
      },
      { status: 500 },
    );
  }
}
