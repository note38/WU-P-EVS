import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check if prisma client is properly initialized
    if (!prisma) {
      console.error("Prisma client is not initialized");
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const dateFilter = searchParams.get("dateFilter") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Date filtering helper
    const getDateRange = () => {
      if (dateFilter === "all") return null;

      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }

      return { gte: startDate };
    };

    const dateRange = getDateRange();
    const logs: any[] = [];

    // Get election activities
    const elections = await prisma.election.findMany({
      where: {
        ...(dateRange && { createdAt: dateRange }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            {
              createdBy: {
                username: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }),
      },
      include: {
        createdBy: {
          select: { username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.ceil(limit / 3),
    });

    elections.forEach((election: any) => {
      logs.push({
        id: `election-${election.id}`,
        admin: election.createdBy.username,
        action: "Created election",
        target: election.name,
        performedAt: election.createdAt,
      });
    });

    // Get candidate activities
    const candidates = await prisma.candidate.findMany({
      where: {
        ...(dateRange && { createdAt: dateRange }),
        ...(search && {
          OR: [{ name: { contains: search, mode: "insensitive" } }],
        }),
      },
      include: {
        position: {
          select: { name: true },
        },
        election: {
          include: {
            createdBy: {
              select: { username: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.ceil(limit / 3),
    });

    candidates.forEach((candidate: any) => {
      logs.push({
        id: `candidate-${candidate.id}`,
        admin: candidate.election.createdBy.username,
        action: "Added candidate",
        target: `${candidate.name} for ${candidate.position.name}`,
        performedAt: candidate.createdAt,
      });
    });

    // Get partylist activities
    const partylists = await prisma.partylist.findMany({
      where: {
        ...(dateRange && { createdAt: dateRange }),
        ...(search && {
          name: { contains: search, mode: "insensitive" },
        }),
      },
      include: {
        election: {
          include: {
            createdBy: {
              select: { username: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.ceil(limit / 3),
    });

    partylists.forEach((partylist: any) => {
      logs.push({
        id: `partylist-${partylist.id}`,
        admin: partylist.election.createdBy.username,
        action: "Created partylist",
        target: partylist.name,
        performedAt: partylist.createdAt,
      });
    });

    // Sort all logs by date and apply pagination
    const sortedLogs = logs
      .sort(
        (a, b) =>
          new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      )
      .slice(skip, skip + limit);

    return NextResponse.json({
      data: sortedLogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(logs.length / limit),
        totalCount: logs.length,
        hasMore: page < Math.ceil(logs.length / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin logs:", error);
    // More detailed error logging
    if (error.code === 'P2002') {
      console.error("Database connection issue:", error.message);
      return NextResponse.json(
        { 
          error: "Database connection error",
          message: "Failed to connect to the database. Please check your database configuration."
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: "Failed to fetch admin logs",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to fetch data: 404"
      },
      { status: 500 }
    );
  }
}