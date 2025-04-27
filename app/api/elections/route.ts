import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID from the session
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
      const text = await req.text();
      console.log("Raw request body:", text);

      if (!text || text.trim() === "") {
        return NextResponse.json(
          { error: "Empty request body" },
          { status: 400 }
        );
      }

      data = JSON.parse(text);
      console.log("Parsed request data:", data);
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

    // Parse dates from the form data
    let startDateTime, endDateTime;
    try {
      console.log("Date strings:", {
        startDate: data.startDate,
        startTime: data.startTime,
        endDate: data.endDate,
        endTime: data.endTime,
      });

      // Ensure we have the correct format YYYY-MM-DD and HH:MM:SS
      const startTimeString = data.startTime?.includes(":")
        ? data.startTime
        : "00:00:00";
      const endTimeString = data.endTime?.includes(":")
        ? data.endTime
        : "23:59:59";

      startDateTime = new Date(`${data.startDate}T${startTimeString}`);
      endDateTime = new Date(`${data.endDate}T${endTimeString}`);

      console.log("Parsed dates:", {
        startDateTime,
        endDateTime,
        startValid: !isNaN(startDateTime.getTime()),
        endValid: !isNaN(endDateTime.getTime()),
      });

      if (isNaN(startDateTime.getTime())) {
        throw new Error(
          `Invalid start date: ${data.startDate}T${startTimeString}`
        );
      }

      if (isNaN(endDateTime.getTime())) {
        throw new Error(`Invalid end date: ${data.endDate}T${endTimeString}`);
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
      // First create the election
      const newElection = await prisma.election.create({
        data: {
          name: data.name,
          description: data.description || "",
          startDate: startDateTime,
          endDate: endDateTime,
          status: "DRAFT", // Start as draft
          createdById: userId,
        },
      });

      console.log("Created election:", newElection);

      // Then create partylists if provided
      if (Array.isArray(data.partyList) && data.partyList.length > 0) {
        const partylistsData = data.partyList.map((name: string) => ({
          name: String(name),
          electionId: newElection.id,
          createdById: userId,
        }));

        console.log("Creating partylists:", partylistsData);

        await prisma.partylist.createMany({
          data: partylistsData,
        });
      }

      // Get the complete election with partylists
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

      // More specific error for debugging
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating election:", error);

    // Detailed error handling
    let errorMessage = "Failed to create election";
    let status = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle common errors
      if (errorMessage.includes("Unique constraint failed")) {
        errorMessage = "An election with this name already exists";
        status = 409;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export async function GET() {
  try {
    const elections = await prisma.election.findMany({
      orderBy: { name: "asc" },
      include: { partylists: true },
    });

    return NextResponse.json(elections);
  } catch (error) {
    console.error("Error fetching elections:", error);
    return NextResponse.json(
      { error: "Failed to fetch elections" },
      { status: 500 }
    );
  }
}
