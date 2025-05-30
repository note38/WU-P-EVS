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

    users.forEach((user) => {
      logs.push({
        id: `user-${user.id}`,
        user: user.username,
        action: "User registered",
        ip: "192.168.1.100", // Mock IP since we don't track IPs
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

    voters.forEach((voter) => {
      logs.push({
        id: `voter-${voter.id}`,
        user: `${voter.firstName} ${voter.lastName}`,
        action: "Voter registered",
        ip: "192.168.1.101", // Mock IP
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

    votes.forEach((vote) => {
      const voterName = `${vote.voter.firstName} ${vote.voter.lastName}`;
      if (!search || voterName.toLowerCase().includes(search.toLowerCase())) {
        logs.push({
          id: `vote-${vote.id}`,
          user: voterName,
          action: "Cast vote",
          ip: "192.168.1.102", // Mock IP
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
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
