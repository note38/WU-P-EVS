// API route for handling elections
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/clerk-auth";
import { Prisma } from "@prisma/client";
import { validateAdminAccess } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess();
    if (!authResult.success) {
      return authResult.response;
    }

    const { userId: userIdNum } = authResult;

    // Parse request body
    let data;
    try {
      const rawText = await req.text();
      console.log("Raw request body:", rawText);

      if (!rawText || rawText.trim() === "") {
        return NextResponse.json(
          { error: "Empty request body" },
          { status: 400 }
        );
      }

      try {
        data = JSON.parse(rawText);
        console.log("Parsed request data:", data);
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        return NextResponse.json(
          { error: "Invalid JSON format in request" },
          { status: 400 }
        );
      }
    } catch (e) {
      console.error("Request body error:", e);
      return NextResponse.json(
        { error: "Failed to read request body" },
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

    // Create election in a transaction to ensure data consistency
    try {
      console.log("Creating election with partyList:", data.partyList);

      const election = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // First create the election
          const newElection = await tx.election.create({
            data: {
              name: data.name,
              description: data.description || "",
              startDate: startDateTime,
              endDate: endDateTime,
              createdById: userIdNum!,
              createdAt: new Date(),
              updatedAt: new Date(),
              hideName: true, // Set hideName to true by default for new elections
            },
          });

          // Prepare partylist data, always including "Independent" by default
          const initialNames: string[] = Array.isArray(data.partyList)
            ? data.partyList.map((n: string) => String(n).trim())
            : [];

          if (!initialNames.some((n) => n.toLowerCase() === "independent")) {
            initialNames.push("Independent");
          }

          // Remove duplicates (case-insensitive)
          const uniqueNames = Array.from(
            new Set(initialNames.map((n) => n.toLowerCase()))
          ).map(
            (lowerName) =>
              initialNames.find((n) => n.toLowerCase() === lowerName) as string
          );

          const partylistsData = uniqueNames.map((name: string) => ({
            name,
            electionId: newElection.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await tx.partylist.createMany({
            data: partylistsData,
          });

          return newElection;
        }
      );

      const completeElection = await prisma.election.findUnique({
        where: { id: election.id },
        include: { partylists: true },
      });

      if (!completeElection) {
        return NextResponse.json(
          { error: "Failed to retrieve created election" },
          { status: 500 }
        );
      }

      // Format the response to match the expected format in the client
      const formattedElection = {
        ...completeElection,
        partyList: completeElection.partylists.map((p: any) => p.name) || [],
      };

      console.log("Created election:", formattedElection);

      return NextResponse.json(
        {
          message: "Election created successfully",
          election: formattedElection,
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return NextResponse.json(
        {
          error:
            dbError instanceof Error
              ? dbError.message
              : "Failed to create election",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating election:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create election",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get elections with partylists
    const elections = await prisma.election.findMany({
      include: { partylists: true },
      orderBy: { createdAt: "desc" },
    });

    // Format elections to include partyList in the expected format
    const formattedElections = elections.map((election: any) => ({
      ...election,
      partyList: election.partylists.map((p: any) => p.name),
    }));

    return NextResponse.json(formattedElections);
  } catch (error) {
    console.error("Error fetching elections:", error);
    return NextResponse.json(
      { error: "Failed to fetch elections" },
      { status: 500 }
    );
  }
}
