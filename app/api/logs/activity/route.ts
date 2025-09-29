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

    // Get user registration activities
    const users = await prisma.user.findMany({
      where: {
        ...(dateRange && { createdAt: dateRange }),
        ...(search && {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.ceil(limit / 3),
    });

    users.forEach((user: any) => {
      logs.push({
        id: `user-${user.id}`,
        user: user.username,
        action: "User registered",
        // Removed IP address
        performedAt: user.createdAt,
      });
    });

    // Get voter registration activities
    const voters = await prisma.voter.findMany({
      where: {
        ...(dateRange && { createdAt: dateRange }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.ceil(limit / 3),
    });

    voters.forEach((voter: any) => {
      logs.push({
        id: `voter-${voter.id}`,
        user: `${voter.firstName} ${voter.lastName}`,
        action: "Voter registered",
        // Removed IP address
        performedAt: voter.createdAt,
      });
    });

    // Get voting activities
    const votes = await prisma.vote.findMany({
      where: {
        ...(dateRange && { votedAt: dateRange }),
      },
      include: {
        voter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { votedAt: "desc" },
      take: Math.ceil(limit / 3),
    });

    votes.forEach((vote: any) => {
      const voterName = `${vote.voter.firstName} ${vote.voter.lastName}`;
      if (!search || voterName.toLowerCase().includes(search.toLowerCase())) {
        logs.push({
          id: `vote-${vote.id}`,
          user: voterName,
          action: "Cast vote",
          // Removed IP address
          performedAt: vote.votedAt,
        });
      }
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
    console.error("Error fetching activity logs:", error);
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
        error: "Failed to fetch activity logs",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to fetch data: 404"
      },
      { status: 500 }
    );
  }
}