import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
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
    const voterLogs = voters.map((voter) => ({
      id: voter.id.toString(),
      name: `${voter.firstName} ${voter.lastName}`,
      email: voter.email,
      registeredAt: voter.createdAt,
      status: voter.status.toLowerCase(),
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
  } catch (error) {
    console.error("Error fetching voter logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch voter logs" },
      { status: 500 }
    );
  }
}
