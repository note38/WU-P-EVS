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

    // Build for search and date filtering
    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
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

      whereClause.createdAt = {
        gte: startDate,
      };
    }

    // Get voters with related data
    const voters = await prisma.voter.findMany({
      where: whereClause,
      include: {
        election: {
          select: { name: true },
        },
        year: {
          include: {
            department: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.voter.count({ where: whereClause });

    // Transform data for frontend
    const voterLogs = voters.map((voter: any) => ({
      id: voter.id.toString(),
      name: `${voter.firstName} ${voter.lastName}`,
      email: voter.email,
      registeredAt: voter.createdAt,
      status: voter.status?.toLowerCase() || "unknown",
      election: voter.election?.name || "No election",
      department: voter.year?.department?.name || "Unknown",
    }));

    return NextResponse.json({
      data: voterLogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: page < Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching voter logs:", error);
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
        error: "Failed to fetch voter logs",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to fetch data: 404"
      },
      { status: 500 }
    );
  }
}