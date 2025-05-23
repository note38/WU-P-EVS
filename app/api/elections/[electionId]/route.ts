import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest, context: any) {
  try {
    const electionId = parseInt(context.params.electionId);

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
      partyList: election.partylists.map((p) => p.name) || [],
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
    // Get the authenticated user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from session
    let userId: number;
    try {
      userId =
        typeof session.user.id === "string"
          ? parseInt(session.user.id)
          : session.user.id;
      if (isNaN(userId)) {
        throw new Error("Invalid user ID format");
      }
    } catch (e) {
      console.error("User ID parsing error:", e);
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Parse election ID from params
    const electionId = parseInt(context.params.electionId);

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
      const updatedElection = await prisma.$transaction(async (tx) => {
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
          // Log the partyList data for debugging
          console.log("Processing partyList update:", data.partyList);

          try {
            // Delete existing partylists
            console.log(
              `Deleting existing partylists for electionId: ${electionId}`
            );
            await tx.partylist.deleteMany({
              where: { electionId },
            });

            // Always ensure there is an "Independent" partylist and deduplicate names
            const initialNames: string[] = data.partyList.map((n: string) =>
              String(n).trim()
            );

            if (!initialNames.some((n) => n.toLowerCase() === "independent")) {
              initialNames.push("Independent");
            }

            const uniqueNames = Array.from(
              new Set(initialNames.map((n) => n.toLowerCase()))
            ).map(
              (lowerName) =>
                initialNames.find(
                  (n) => n.toLowerCase() === lowerName
                ) as string
            );

            const partylistsData = uniqueNames.map((name: string) => ({
              name,
              electionId,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            console.log("Creating new partylists:", partylistsData);
            await tx.partylist.createMany({
              data: partylistsData,
            });
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
        partyList: completeElection?.partylists.map((p) => p.name) || [],
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
    // Get the authenticated user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const electionId = parseInt(context.params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID format" },
        { status: 400 }
      );
    }

    try {
      // Delete the election directly - Prisma will handle cascading deletes
      await prisma.election.delete({
        where: { id: electionId },
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
      }

      return NextResponse.json(
        { error: "Failed to delete election" },
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
