import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ electionId: string }> }
) {
  try {
    // Await params before accessing properties (Next.js 15 requirement)
    const resolvedParams = await params;
    const { electionId: electionIdStr } = resolvedParams;
    const electionId = parseInt(electionIdStr);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "8");
    const search = searchParams.get("search");
    const yearFilter = searchParams.get("year");
    const departmentFilter = searchParams.get("department");
    const skip = (page - 1) * limit;

    // Validate that the election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Build dynamic filters using AND conditions so that multiple filters can coexist
    const andFilters: any[] = [{ electionId }];

    if (search) {
      andFilters.push({
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            AND: [
              {
                firstName: {
                  contains: search.split(" ")[0] || "",
                  mode: "insensitive" as const,
                },
              },
              {
                lastName: {
                  contains: search.split(" ")[1] || search.split(" ")[0] || "",
                  mode: "insensitive" as const,
                },
              },
            ],
          },
        ],
      });
    }

    // Filter by year (expects yearId)
    if (yearFilter && yearFilter !== "all" && !isNaN(parseInt(yearFilter))) {
      andFilters.push({ yearId: parseInt(yearFilter) });
    }

    // Filter by department (expects department name string coming from frontend)
    if (departmentFilter && departmentFilter !== "all") {
      andFilters.push({
        year: {
          department: {
            name: {
              equals: departmentFilter,
              mode: "insensitive" as const,
            },
          },
        },
      });
    }

    const whereClause: any =
      andFilters.length > 1 ? { AND: andFilters } : andFilters[0];

    // Get total count for pagination
    const totalVoters = await prisma.voter.count({
      where: whereClause,
    });

    // Fetch voters for this specific election with their related data
    const voters = await prisma.voter.findMany({
      where: whereClause,
      include: {
        year: {
          include: {
            department: true,
          },
        },
        votes: {
          where: {
            electionId: electionId,
          },
          select: {
            votedAt: true,
          },
          orderBy: {
            votedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        id: "asc",
      },
      skip: skip,
      take: limit,
    });

    // Transform the data to include department and latest vote information
    const transformedVoters = voters.map((voter) => ({
      id: voter.id,
      firstName: voter.firstName,
      lastName: voter.lastName,
      middleName: voter.middleName,
      email: voter.email,
      avatar: voter.avatar,
      year: voter.year,
      department: voter.year?.department || null,
      status: voter.status,
      votedAt:
        voter.votes.length > 0 ? voter.votes[0].votedAt.toISOString() : null,
      electionId: voter.electionId,
      credentialsSent: voter.credentialsSent,
    }));

    return NextResponse.json({
      voters: transformedVoters,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalVoters / limit),
        totalVoters: totalVoters,
        hasMore: page < Math.ceil(totalVoters / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching voters:", error);
    return NextResponse.json(
      { error: "Failed to fetch voters" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ electionId: string }> }
) {
  try {
    // Await params before accessing properties (Next.js 15 requirement)
    const { electionId: electionIdStr } = await params;
    const electionId = parseInt(electionIdStr);

    const body = await request.json();
    const { yearId, departmentId, allDepartments } = body;

    // Validate that yearId exists
    if (!yearId) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    // Validate that the election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Build the query to find all voters based on year and department criteria
    let query: any = {
      where: {
        yearId: parseInt(yearId),
        electionId: null, // Only get voters not already assigned to an election
      },
      select: {
        id: true,
      },
    };

    // If not "all departments" and a specific department was selected
    if (!allDepartments && departmentId) {
      query.where.departmentId = parseInt(departmentId);
    }

    // Find voters matching the criteria
    const voters = await prisma.voter.findMany(query);

    if (voters.length === 0) {
      return NextResponse.json(
        { error: "No unassigned voters found with the specified criteria" },
        { status: 404 }
      );
    }

    // Update all found voters to assign them to this election
    const bulkUpdateResult = await prisma.voter.updateMany({
      where: {
        id: {
          in: voters.map((voter) => voter.id),
        },
      },
      data: {
        electionId: electionId,
      },
    });

    return NextResponse.json({
      message: "Voters imported successfully",
      count: bulkUpdateResult.count,
    });
  } catch (error) {
    console.error("Error importing voters:", error);
    return NextResponse.json(
      { error: "Failed to import voters" },
      { status: 500 }
    );
  }
}
