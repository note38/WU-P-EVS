import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { validateAdminAccess } from "@/lib/auth-utils";

export async function GET(req: NextRequest, context: any) {
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

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: { partylists: true },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Format the response to match the expected format in the client
    const formattedElection = {
      ...election,
      partyList: election.partylists.map((p: any) => p.name) || [],
    };

    return NextResponse.json(formattedElection);
  } catch (error) {
    console.error("Error fetching election:", error);
    return NextResponse.json(
      { error: "Failed to fetch election" },
      { status: 500 }
    );
  }
}

// PUT handler for updating a specific election
export async function PUT(req: NextRequest, context: any) {
  try {
    // Validate admin access
    const adminValidation = await validateAdminAccess();
    if (!adminValidation.success) {
      return adminValidation.response;
    }

    const userId = adminValidation.userId;

    // Parse election ID from params
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
      include: { partylists: true },
    });

    if (!existingElection) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Parse request body
    let data;
    try {
      const text = await req.text();
      console.log("Raw update request body:", text);

      if (!text || text.trim() === "") {
        return NextResponse.json(
          { error: "Empty request body" },
          { status: 400 }
        );
      }

      data = JSON.parse(text);
      console.log("Parsed update data:", data);
    } catch (e) {
      console.error("JSON parsing error:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request data" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    if (!data.startDate) {
      return NextResponse.json(
        { error: "Missing required field: startDate" },
        { status: 400 }
      );
    }

    if (!data.endDate) {
      return NextResponse.json(
        { error: "Missing required field: endDate" },
        { status: 400 }
      );
    }

    // Parse dates
    let startDateTime, endDateTime;
    try {
      startDateTime = new Date(data.startDate);
      endDateTime = new Date(data.endDate);

      if (isNaN(startDateTime.getTime())) {
        throw new Error(`Invalid start date: ${data.startDate}`);
      }

      if (isNaN(endDateTime.getTime())) {
        throw new Error(`Invalid end date: ${data.endDate}`);
      }
    } catch (e) {
      console.error("Date parsing error:", e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid date format" },
        { status: 400 }
      );
    }

    // Check if end date is after start date
    if (endDateTime <= startDateTime) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    try {
      // Update the election in a transaction along with partylists if provided
      const updatedElection = await prisma.$transaction(async (tx: any) => {
        // Update election details
        const updated = await tx.election.update({
          where: { id: electionId },
          data: {
            name: data.name,
            description: data.description || "",
            startDate: startDateTime,
            endDate: endDateTime,
            updatedAt: new Date(),
          },
        });

        // Handle partylists update if provided
        if (Array.isArray(data.partyList)) {
          try {
            // First, we need to handle candidates that reference these partylists
            // Get all candidates for this election
            const candidates = await tx.candidate.findMany({
              where: { electionId },
              include: { partylist: true },
            });

            // Get current partylists
            const currentPartylists = await tx.partylist.findMany({
              where: { electionId },
            });

            // Create a map of partylist names to IDs
            const partylistMap = new Map<string, number>();
            currentPartylists.forEach((pl: any) => {
              partylistMap.set(pl.name.toLowerCase(), pl.id);
            });

            // Find "Independent" partylist ID (if exists)
            const independentPartylist = currentPartylists.find(
              (pl: any) => pl.name.toLowerCase() === "independent"
            );

            // Process the new partylist names
            const initialNames: string[] = data.partyList.map((n: string) =>
              String(n).trim()
            );

            // Always ensure there is an "Independent" partylist
            if (!initialNames.some((n) => n.toLowerCase() === "independent")) {
              initialNames.push("Independent");
            }

            // Deduplicate names
            const uniqueNames = Array.from(
              new Set(initialNames.map((n) => n.toLowerCase()))
            ).map(
              (lowerName) =>
                initialNames.find(
                  (n) => n.toLowerCase() === lowerName
                ) as string
            );

            // Determine which partylists to delete
            const partylistsToDelete = currentPartylists.filter(
              (pl: any) =>
                !uniqueNames.some(
                  (name) => name.toLowerCase() === pl.name.toLowerCase()
                )
            );

            // Determine which partylists to create
            const partylistsToCreate = uniqueNames.filter(
              (name) =>
                !currentPartylists.some(
                  (pl: any) => pl.name.toLowerCase() === name.toLowerCase()
                )
            );

            // Delete candidates that reference partylists we're about to delete
            if (partylistsToDelete.length > 0) {
              const partylistIdsToDelete = partylistsToDelete.map(
                (pl: any) => pl.id
              );
              await tx.candidate.deleteMany({
                where: {
                  electionId,
                  partylistId: { in: partylistIdsToDelete },
                },
              });
            }

            // Delete the partylists that are no longer needed
            if (partylistsToDelete.length > 0) {
              const partylistIdsToDelete = partylistsToDelete.map(
                (pl: any) => pl.id
              );
              await tx.partylist.deleteMany({
                where: {
                  id: { in: partylistIdsToDelete },
                },
              });
            }

            // Create new partylists
            if (partylistsToCreate.length > 0) {
              const partylistsData = partylistsToCreate.map((name: string) => ({
                name,
                electionId,
                createdAt: new Date(),
                updatedAt: new Date(),
              }));

              await tx.partylist.createMany({
                data: partylistsData,
              });
            }
          } catch (partylistError) {
            console.error("Error updating partylists:", partylistError);
            throw new Error(
              partylistError instanceof Error
                ? `Error updating partylists: ${partylistError.message}`
                : "Unknown error updating partylists"
            );
          }
        }

        return updated;
      });

      // Get the complete updated election with partylists
      const completeElection = await prisma.election.findUnique({
        where: { id: electionId },
        include: { partylists: true },
      });

      // Format the response to match the expected format in the client
      // Convert partylists to partyList array format that the client expects
      const formattedElection = {
        ...completeElection,
        partyList: completeElection?.partylists.map((p: any) => p.name) || [],
      };

      return NextResponse.json({
        message: "Election updated successfully",
        election: formattedElection,
      });
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating election:", error);
    let errorMessage = "Failed to update election";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE handler for deleting a specific election - using 'any' type to fix route handler issue
export async function DELETE(req: NextRequest, context: any) {
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

    try {
      // First, check if the election exists
      const existingElection = await prisma.election.findUnique({
        where: { id: electionId },
      });

      if (!existingElection) {
        return NextResponse.json(
          { error: "Election not found" },
          { status: 404 }
        );
      }

      // Delete the election and all related data in a transaction
      await prisma.$transaction(async (tx: any) => {
        // Delete all votes for this election first
        await tx.vote.deleteMany({
          where: { electionId },
        });

        // Delete all candidates for this election
        await tx.candidate.deleteMany({
          where: { electionId },
        });

        // Delete all positions for this election
        await tx.position.deleteMany({
          where: { electionId },
        });

        // Delete all partylists for this election
        await tx.partylist.deleteMany({
          where: { electionId },
        });

        // Delete all voters associated with this election
        // Note: Because of onDelete: SetNull, this will set electionId to NULL rather than delete voters
        // But we still need to handle this properly

        // Finally, delete the election itself
        await tx.election.delete({
          where: { id: electionId },
        });
      });

      return NextResponse.json({
        message: "Election deleted successfully",
      });
    } catch (dbError) {
      console.error("Database error:", dbError);

      // Check for specific Prisma errors
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        if (dbError.code === "P2025") {
          return NextResponse.json(
            { error: "Election not found" },
            { status: 404 }
          );
        }
        // Handle foreign key constraint violations
        if (dbError.code === "P2003") {
          return NextResponse.json(
            { error: "Cannot delete election with associated data" },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        {
          error:
            "Failed to delete election: " +
            (dbError instanceof Error ? dbError.message : "Unknown error"),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in DELETE handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
