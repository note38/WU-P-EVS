import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Add runtime configuration

export async function POST(
  request: NextRequest,
  { params }: { params: { electionId: string } }
) {
  try {
    const electionId = parseInt(params.electionId);
    const body = await request.json();
    const { yearId, departmentId, allDepartments } = body;

    console.log("Import request params:", {
      electionId,
      yearId,
      departmentId,
      allDepartments,
    });

    // Validate input parameters
    if (!electionId || isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID" },
        { status: 400 }
      );
    }

    if (!yearId || isNaN(parseInt(yearId))) {
      return NextResponse.json({ error: "Invalid year ID" }, { status: 400 });
    }

    if (departmentId && isNaN(parseInt(departmentId))) {
      return NextResponse.json(
        { error: "Invalid department ID" },
        { status: 400 }
      );
    }

    // Validate that the election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Build the query to find all voters based on year and department criteria
    const query = {
      where: {
        yearId: parseInt(yearId),
        ...(!allDepartments &&
          departmentId && {
            year: {
              departmentId: parseInt(departmentId),
            },
          }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    };

    // Find voters matching the criteria
    const voters = await prisma.voter.findMany(query);

    if (voters.length === 0) {
      return NextResponse.json(
        { error: "No voters found with the specified criteria" },
        { status: 404 }
      );
    }

    const BATCH_SIZE = 25; // Reduced batch size
    let updatedCount = 0;
    let errors = [];

    for (let i = 0; i < voters.length; i += BATCH_SIZE) {
      const batch = voters.slice(i, i + BATCH_SIZE);
      try {
        console.log(
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(voters.length / BATCH_SIZE)}`
        );
        const result = await prisma.voter.updateMany({
          where: {
            id: {
              in: batch.map((voter) => voter.id),
            },
          },
          data: {
            electionId: electionId,
            status: "UNCAST",
          },
        });
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} result:`, result);
        updatedCount += result.count;
      } catch (batchError) {
        const errorMessage =
          batchError instanceof Error
            ? batchError.message
            : "Unknown batch error";
        console.error(
          `Error updating batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
          {
            error: batchError,
            message: errorMessage,
            batchIds: batch.map((v) => v.id),
          }
        );
        errors.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: errorMessage,
          voterIds: batch.map((v) => v.id),
        });
      }
    }

    if (updatedCount === 0) {
      console.warn(
        "No voters needed updating; they may already belong to this election."
      );
    }

    return NextResponse.json({
      message: "Voter import processed",
      updated: updatedCount,
      count: updatedCount,
      totalMatched: voters.length,
      alreadyAssigned: voters.length - updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing voters:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      params: { electionId: params.electionId },
    });

    return NextResponse.json(
      {
        error: `Failed to import voters: ${errorMessage}`,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
