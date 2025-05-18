"use client";

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { electionId: string } }
) {
  try {
    const electionId = parseInt(params.electionId);
    const body = await request.json();
    const { yearId, departmentId, allDepartments } = body;

    // Validate that yearId exists
    if (!yearId) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
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
    let query: any = {
      where: {
        yearId: parseInt(yearId),
        electionId: null, // Only get voters not already assigned to an election
      },
      select: {
        id: true,
      },
    };

    // If not "all departments" and a specific department was selected
    if (!allDepartments && departmentId) {
      // Add the year's department filter
      query.where.year = {
        departmentId: parseInt(departmentId),
      };
    }

    // Find voters matching the criteria
    const voters = await prisma.voter.findMany(query);

    if (voters.length === 0) {
      return NextResponse.json(
        { error: "No unassigned voters found with the specified criteria" },
        { status: 404 }
      );
    }

    // Update all found voters to assign them to this election
    const bulkUpdateResult = await prisma.voter.updateMany({
      where: {
        id: {
          in: voters.map((voter) => voter.id),
        },
      },
      data: {
        electionId: electionId,
      },
    });

    return NextResponse.json({
      message: "Voters imported successfully",
      count: bulkUpdateResult.count,
    });
  } catch (error) {
    console.error("Error importing voters:", error);
    return NextResponse.json(
      { error: "Failed to import voters" },
      { status: 500 }
    );
  }
}
