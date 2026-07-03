import { prisma } from "@/lib/db";

export interface DashboardStats {
  totalElections: number;
  activeElections: number;
  completedElections: number;
  totalCandidates: number;
  totalPartylists: number;
  totalVoters: number;
  votedVoters: number;
  totalVotes: number;
}

export interface RecentActivity {
  id: number;
  action: string;
  user: string;
  time: string;
  timestamp: Date;
}

export interface RecentVoter {
  id: number;
  name: string;
  time: string;
  timestamp: Date;
}

export interface ElectionResult {
  id: number;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "INACTIVE";
  hideName?: boolean;
  totalVoters?: number;
  positions: {
    id: number;
    name: string;
    candidates: {
      id: number;
      name: string;
      avatar: string | null;
      partylist: string;
      votes: number;
    }[];
  }[];
}

// ---------------------------------------------------------------------------
// Helper: fetch all vote counts for a given election in ONE query (groupBy)
// Returns a Map<candidateId, voteCount> for O(1) lookups.
// Before: N candidates × M positions = N*M prisma.vote.count() calls
// After: 1 prisma.vote.groupBy() call total — regardless of candidate count
// ---------------------------------------------------------------------------
async function getVoteCountMap(electionId: number): Promise<Map<number, number>> {
  const rows = await prisma.vote.groupBy({
    by: ["candidateId"],
    where: { electionId },
    _count: { candidateId: true },
  });

  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.candidateId, row._count.candidateId);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Helper: build ElectionResult positions from an election with candidates
// already fetched via include. Uses a pre-built voteCountMap (no extra queries).
// ---------------------------------------------------------------------------
function buildPositions(
  election: {
    positions: {
      id: number;
      name: string;
      candidates: {
        id: number;
        name: string;
        avatar: string | null;
        partylist: { name: string } | null;
      }[];
    }[];
  },
  voteCountMap: Map<number, number>
) {
  const positions = [];

  for (const position of election.positions) {
    const candidates = [];

    for (const candidate of position.candidates) {
      if (!candidate.partylist) {
        console.warn(`Candidate ${candidate.id} has no partylist`);
        continue;
      }

      candidates.push({
        id: candidate.id,
        name: candidate.name,
        avatar: candidate.avatar,
        partylist: candidate.partylist.name,
        votes: voteCountMap.get(candidate.id) ?? 0,
      });
    }

    candidates.sort((a, b) => b.votes - a.votes);

    positions.push({
      id: position.id,
      name: position.name,
      candidates,
    });
  }

  return positions;
}

export class DashboardDataService {
  // Get dashboard statistics
  // Uses Promise.all so all 8 count queries run in parallel (not sequential).
  static async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalElections,
      activeElections,
      completedElections,
      totalCandidates,
      totalPartylists,
      totalVoters,
      votedVoters,
      totalVotes,
    ] = await Promise.all([
      prisma.election.count(),
      prisma.election.count({ where: { status: "ACTIVE" } }),
      prisma.election.count({ where: { status: "COMPLETED" } }),
      prisma.candidate.count(),
      prisma.partylist.count(),
      prisma.voter.count(),
      prisma.voter.count({ where: { status: "CAST" } }),
      prisma.vote.count(),
    ]);

    return {
      totalElections,
      activeElections,
      completedElections,
      totalCandidates,
      totalPartylists,
      totalVoters,
      votedVoters,
      totalVotes,
    };
  }

  // Get recent activities (system activities and updates)
  static async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Run all 4 queries in parallel
    const [recentVoters, recentElections, recentCandidates, recentVotes] =
      await Promise.all([
        prisma.voter.findMany({
          take: Math.ceil(limit / 4),
          orderBy: { createdAt: "desc" },
        }),
        prisma.election.findMany({
          take: Math.ceil(limit / 4),
          orderBy: { createdAt: "desc" },
        }),
        prisma.candidate.findMany({
          take: Math.ceil(limit / 4),
          orderBy: { createdAt: "desc" },
          include: { partylist: true },
        }),
        prisma.vote.findMany({
          take: Math.ceil(limit / 4),
          orderBy: { votedAt: "desc" },
          include: { voter: true },
        }),
      ]);

    recentVoters.forEach((voter: any) => {
      activities.push({
        id: voter.id + 20000,
        action: "New Voter Registered",
        user: `${voter.firstName} ${voter.lastName}`,
        time: formatTimeAgo(voter.createdAt),
        timestamp: voter.createdAt,
      });
    });

    recentElections.forEach((election: any) => {
      activities.push({
        id: election.id + 10000,
        action:
          election.status === "ACTIVE"
            ? "Election Started"
            : election.status === "COMPLETED"
              ? "Election Completed"
              : "Election Created",
        user: "System Admin",
        time: formatTimeAgo(election.createdAt),
        timestamp: election.createdAt,
      });
    });

    recentCandidates.forEach((candidate: any) => {
      activities.push({
        id: candidate.id + 30000,
        action: "New Candidate Added",
        user: `${candidate.name} (${candidate.partylist.name})`,
        time: formatTimeAgo(candidate.createdAt),
        timestamp: candidate.createdAt,
      });
    });

    recentVotes.forEach((vote: any) => {
      activities.push({
        id: vote.id,
        action: "Vote Cast",
        user: `${vote.voter.firstName} ${vote.voter.lastName}`,
        time: formatTimeAgo(vote.votedAt),
        timestamp: vote.votedAt,
      });
    });

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get recent voters
  static async getRecentVoters(limit: number = 10): Promise<RecentVoter[]> {
    const recentVoters = await prisma.voter.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return recentVoters.map((voter: any) => ({
      id: voter.id,
      name: `${voter.firstName} ${voter.lastName}`,
      time: formatTimeAgo(voter.createdAt),
      timestamp: voter.createdAt,
    }));
  }

  // Get election results for the live results tab (admin dashboard)
  // BEFORE: N candidates × M positions individual prisma.vote.count() calls per election
  // AFTER:  1 query total per election via groupBy — all elections still parallel
  static async getElectionResults(): Promise<ElectionResult[]> {
    const elections = await prisma.election.findMany({
      where: {
        OR: [
          { status: "ACTIVE" },
          { status: "COMPLETED" },
          { status: "INACTIVE" },
        ],
      },
      include: {
        positions: {
          orderBy: { createdAt: "asc" },
          include: {
            candidates: {
              include: { partylist: true },
            },
          },
        },
        _count: { select: { voters: true } },
      },
      orderBy: { startDate: "desc" },
    });

    // Fetch all vote counts in parallel — one groupBy per election
    const voteCountMaps = await Promise.all(
      elections.map((e) => getVoteCountMap(e.id))
    );

    return elections.map((election, i) => ({
      id: election.id,
      name: election.name,
      status: election.status,
      hideName: election.hideName,
      totalVoters: election._count.voters,
      positions: buildPositions(election, voteCountMaps[i]),
    }));
  }

  // Get active election for live results (home page)
  // BEFORE: N*M individual prisma.vote.count() calls
  // AFTER:  2 queries total (1 findFirst + 1 groupBy)
  static async getActiveElectionResults(): Promise<ElectionResult | null> {
    try {
      const activeElection = await prisma.election.findFirst({
        where: { status: "ACTIVE" },
        include: {
          positions: {
            orderBy: { createdAt: "asc" },
            include: {
              candidates: {
                include: { partylist: true },
              },
            },
          },
          _count: { select: { voters: true } },
        },
      });

      if (!activeElection) return null;

      console.log(
        `🎯 Found active election: ${activeElection.name} with ${activeElection.positions.length} positions`
      );

      // ONE groupBy query replaces all the per-candidate vote.count() calls
      const voteCountMap = await getVoteCountMap(activeElection.id);

      const result = {
        id: activeElection.id,
        name: activeElection.name,
        status: activeElection.status,
        hideName: activeElection.hideName,
        totalVoters: activeElection._count.voters,
        positions: buildPositions(activeElection, voteCountMap),
      };

      console.log(`✅ Returning active election result:`, {
        name: result.name,
        positionsCount: result.positions.length,
        totalCandidates: result.positions.reduce(
          (sum, pos) => sum + pos.candidates.length,
          0
        ),
      });

      return result;
    } catch (error) {
      console.error("Error fetching active election results:", error);
      return null;
    }
  }

  // Get recent completed election for home page (within 24 hours)
  // BEFORE: N*M individual prisma.vote.count() calls
  // AFTER:  2 queries total (1 findFirst + 1 groupBy)
  static async getRecentCompletedElectionResults(): Promise<ElectionResult | null> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const recentCompletedElection = await prisma.election.findFirst({
        where: {
          status: "COMPLETED",
          endDate: { gte: twentyFourHoursAgo },
        },
        include: {
          positions: {
            orderBy: { createdAt: "asc" },
            include: {
              candidates: {
                include: { partylist: true },
              },
            },
          },
          _count: { select: { voters: true } },
        },
        orderBy: { endDate: "desc" },
      });

      if (!recentCompletedElection) return null;

      // ONE groupBy query replaces all the per-candidate vote.count() calls
      const voteCountMap = await getVoteCountMap(recentCompletedElection.id);

      return {
        id: recentCompletedElection.id,
        name: recentCompletedElection.name,
        status: recentCompletedElection.status,
        hideName: recentCompletedElection.hideName,
        totalVoters: recentCompletedElection._count.voters,
        positions: buildPositions(recentCompletedElection, voteCountMap),
      };
    } catch (error) {
      console.error("Error fetching recent completed election results:", error);
      return null;
    }
  }

  // Get election results for home page
  // BEFORE: N candidates × M positions × E elections individual vote.count() calls
  // AFTER:  1 findMany + 1 groupBy per election (run in parallel)
  static async getHomePageElectionResults(): Promise<ElectionResult[]> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const elections = await prisma.election.findMany({
        where: {
          OR: [
            { status: "ACTIVE" },
            {
              status: "COMPLETED",
              endDate: { gte: twentyFourHoursAgo },
            },
          ],
        },
        include: {
          positions: {
            orderBy: { createdAt: "asc" },
            include: {
              candidates: {
                include: { partylist: true },
              },
            },
          },
          _count: { select: { voters: true } },
        },
        orderBy: { startDate: "desc" },
      });

      if (elections.length === 0) return [];

      // Fetch all vote counts in parallel — one groupBy per election
      const voteCountMaps = await Promise.all(
        elections.map((e) => getVoteCountMap(e.id))
      );

      return elections.map((election, i) => ({
        id: election.id,
        name: election.name,
        status: election.status,
        hideName: election.hideName,
        totalVoters: election._count.voters,
        positions: buildPositions(election, voteCountMaps[i]),
      }));
    } catch (error) {
      console.error("Error fetching home page election results:", error);
      return [];
    }
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}
