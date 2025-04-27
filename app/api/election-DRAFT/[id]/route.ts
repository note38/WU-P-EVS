import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const elections = await prisma.election.findMany({
      where: {
        status: "ACTIVE", // Only fetch active elections
      },
      orderBy: { name: "asc" },
      cacheStrategy: { ttl: 300 }, // Cache for 5 minutes since election status can change
    });

    return NextResponse.json(elections);
  } catch (error) {
    console.error("Error fetching elections:", error);
    return NextResponse.json(
      { message: "Failed to fetch elections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID from the session - careful with type conversions
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

    // Parse the request body
    let data;
    try {
      data = await req.json();
      console.log("Request data:", JSON.stringify(data));
    } catch (e) {
      console.error("JSON parsing error:", e);
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.name || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Parse dates from the form data
    let startDateTime, endDateTime;
    try {
      startDateTime = new Date(
        `${data.startDate}T${data.startTime || "00:00:00.000Z"}`
      );
      endDateTime = new Date(
        `${data.endDate}T${data.endTime || "23:59:59.999Z"}`
      );

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error("Invalid date format");
      }
    } catch (e) {
      console.error("Date parsing error:", e);
      return NextResponse.json(
        { error: "Invalid date format" },
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

    // Simplify the process - avoid transactions initially to identify issues
    try {
      // First create the election
      console.log("Creating election with data:", {
        name: data.name,
        description: data.description || "",
        startDate: startDateTime,
        endDate: endDateTime,
        status: "DRAFT",
        createdById: userId,
      });

      const newElection = await prisma.election.create({
        data: {
          name: data.name,
          description: data.description || "",
          startDate: startDateTime,
          endDate: endDateTime,
          status: "DRAFT",
          createdById: userId,
        },
      });

      console.log("Election created:", newElection);

      // Then create partylists if provided
      if (data.partyList?.length > 0) {
        const partylistData = data.partyList.map((name: string) => ({
          name,
          electionId: newElection.id,
          createdById: userId,
        }));

        console.log("Creating partylists:", partylistData);

        await prisma.partylist.createMany({
          data: partylistData,
        });
      }

      // Fetch the complete election with partylists
      const completeElection = await prisma.election.findUnique({
        where: { id: newElection.id },
        include: { partylists: true },
      });

      return NextResponse.json(
        {
          message: "Election created successfully",
          election: completeElection,
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      throw dbError; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error("Error creating election:", error);

    // More detailed error handling
    let errorMessage = "Failed to create election";
    let status = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle common Prisma errors
      if (error.message.includes("Unique constraint failed")) {
        errorMessage = "An election with this name already exists";
        status = 409;
      }

      // Check for missing field errors
      if (error.message.includes("Field required but not supplied")) {
        errorMessage = "Missing required fields in database schema";
        status = 400;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
