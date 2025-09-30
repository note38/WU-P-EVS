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

    // Build where clause for search and date filtering
    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        {
          voter: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        { election: { name: { contains: search, mode: "insensitive" } } },
        { position: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Date filtering
    if (dateFilter !== "all") {
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

      whereClause.votedAt = {
        gte: startDate,
      };
    }

    // Get votes with related data
    const votes = await prisma.vote.findMany({
      where: whereClause,
      include: {
        voter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        election: {
          select: {
            name: true,
            status: true,
          },
        },
        position: {
          select: { name: true },
        },
      },
      orderBy: { votedAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.vote.count({ where: whereClause });

    // Transform data for frontend
    const voteLogs = votes.map((vote: any) => ({
      id: vote.id.toString(),
      voter: `${vote.voter.firstName} ${vote.voter.lastName}`,
      voterEmail: vote.voter.email,
      election: vote.election.name,
      position: vote.position.name,
      votedAt: vote.votedAt,
      status: vote.election.status === "COMPLETED" ? "counted" : "pending",
    }));

    return NextResponse.json({
      data: voteLogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: page < Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching vote logs:", error);
    // More detailed error logging
    if (error.code === "P2002") {
      console.error("Database connection issue:", error.message);
      return NextResponse.json(
        {
          error: "Database connection error",
          message:
            "Failed to connect to the database. Please check your database configuration.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        error: "Failed to fetch vote logs",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Failed to fetch data: 404",
      },
      { status: 500 }
    );
  }
}
