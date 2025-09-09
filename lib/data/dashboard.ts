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

export class DashboardDataService {
  // Get dashboard statistics
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
      // Total elections
      prisma.election.count(),

      // Active elections
      prisma.election.count({
        where: { status: "ACTIVE" },
      }),

      // Completed elections
      prisma.election.count({
        where: { status: "COMPLETED" },
      }),

      // Total candidates
      prisma.candidate.count(),

      // Total partylists
      prisma.partylist.count(),

      // Total voters
      prisma.voter.count(),

      // Voters who have voted
      prisma.voter.count({
        where: { status: "VOTED" },
      }),

      // Total votes cast
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
  static async getRecentActivities(
    limit: number = 10
  ): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Get recent voter registrations
    const recentVoters = await prisma.voter.findMany({
      take: Math.ceil(limit / 4),
      orderBy: { createdAt: "desc" },
    });

    // Get recent elections
    const recentElections = await prisma.election.findMany({
      take: Math.ceil(limit / 4),
      orderBy: { createdAt: "desc" },
    });

    // Get recent candidates
    const recentCandidates = await prisma.candidate.findMany({
      take: Math.ceil(limit / 4),
      orderBy: { createdAt: "desc" },
      include: {
        partylist: true,
      },
    });

    // Get recent votes (for vote cast activities)
    const recentVotes = await prisma.vote.findMany({
      take: Math.ceil(limit / 4),
      orderBy: { votedAt: "desc" },
      include: {
        voter: true,
      },
    });

    // Add voter registration activities
    recentVoters.forEach((voter: any) => {
      activities.push({
        id: voter.id + 20000,
        action: "New Voter Registered",
        user: `${voter.firstName} ${voter.lastName}`,
        time: formatTimeAgo(voter.createdAt),
        timestamp: voter.createdAt,
      });
    });

    // Add election activities
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

    // Add candidate registration activities
    recentCandidates.forEach((candidate: any) => {
      activities.push({
        id: candidate.id + 30000,
        action: "New Candidate Added",
        user: `${candidate.name} (${candidate.partylist.name})`,
        time: formatTimeAgo(candidate.createdAt),
        timestamp: candidate.createdAt,
      });
    });

    // Add vote activities
    recentVotes.forEach((vote: any) => {
      activities.push({
        id: vote.id,
        action: "Vote Cast",
        user: `${vote.voter.firstName} ${vote.voter.lastName}`,
        time: formatTimeAgo(vote.votedAt),
        timestamp: vote.votedAt,
      });
    });

    // Sort by timestamp and return limited results
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get recent voters (recently added to the system)
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

  // Get election results for live results tab
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
          include: {
            candidates: {
              include: {
                partylist: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const results: ElectionResult[] = [];

    for (const election of elections) {
      const positions = [];

      for (const position of election.positions) {
        const candidates = [];

        for (const candidate of position.candidates) {
          // Count votes for this candidate
          const voteCount = await prisma.vote.count({
            where: {
              candidateId: candidate.id,
              positionId: position.id,
              electionId: election.id,
            },
          });

          candidates.push({
            id: candidate.id,
            name: candidate.name,
            avatar: candidate.avatar,
            partylist: candidate.partylist.name,
            votes: voteCount,
          });
        }

        // Sort candidates by vote count
        candidates.sort((a, b) => b.votes - a.votes);

        positions.push({
          id: position.id,
          name: position.name,
          candidates,
        });
      }

      results.push({
        id: election.id,
        name: election.name,
        status: election.status,
        positions,
      });
    }

    return results;
  }

  // Get active election for live results
  static async getActiveElectionResults(): Promise<ElectionResult | null> {
    try {
      const activeElection = await prisma.election.findFirst({
        where: { status: "ACTIVE" },
        include: {
          positions: {
            include: {
              candidates: {
                include: {
                  partylist: true,
                },
              },
            },
          },
        },
      });

      if (!activeElection) return null;

      const positions = [];

      for (const position of activeElection.positions) {
        const candidates = [];

        for (const candidate of position.candidates) {
          // Ensure partylist exists before accessing its properties
          if (!candidate.partylist) {
            console.warn(`Candidate ${candidate.id} has no partylist`);
            continue;
          }

          const voteCount = await prisma.vote.count({
            where: {
              candidateId: candidate.id,
              positionId: position.id,
              electionId: activeElection.id,
            },
          });

          candidates.push({
            id: candidate.id,
            name: candidate.name,
            avatar: candidate.avatar,
            partylist: candidate.partylist.name,
            votes: voteCount,
          });
        }

        candidates.sort((a, b) => b.votes - a.votes);

        positions.push({
          id: position.id,
          name: position.name,
          candidates,
        });
      }

      return {
        id: activeElection.id,
        name: activeElection.name,
        status: activeElection.status,
        positions,
      };
    } catch (error) {
      console.error('Error fetching active election results:', error);
      return null;
    }
  }

  // Get recent completed election for home page (within 24 hours)
  static async getRecentCompletedElectionResults(): Promise<ElectionResult | null> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const recentCompletedElection = await prisma.election.findFirst({
        where: {
          status: "COMPLETED",
          endDate: {
            gte: twentyFourHoursAgo, // Completed within the last 24 hours
          },
        },
        include: {
          positions: {
            include: {
              candidates: {
                include: {
                  partylist: true,
                },
              },
            },
          },
        },
        orderBy: { endDate: "desc" }, // Get the most recently completed
      });

      if (!recentCompletedElection) return null;

      const positions = [];

      for (const position of recentCompletedElection.positions) {
        const candidates = [];

        for (const candidate of position.candidates) {
          // Ensure partylist exists before accessing its properties
          if (!candidate.partylist) {
            console.warn(`Candidate ${candidate.id} has no partylist`);
            continue;
          }

          const voteCount = await prisma.vote.count({
            where: {
              candidateId: candidate.id,
              positionId: position.id,
              electionId: recentCompletedElection.id,
            },
          });

          candidates.push({
            id: candidate.id,
            name: candidate.name,
            avatar: candidate.avatar,
            partylist: candidate.partylist.name,
            votes: voteCount,
          });
        }

        candidates.sort((a, b) => b.votes - a.votes);

        positions.push({
          id: position.id,
          name: position.name,
          candidates,
        });
      }

      return {
        id: recentCompletedElection.id,
        name: recentCompletedElection.name,
        status: recentCompletedElection.status,
        positions,
      };
    } catch (error) {
      console.error('Error fetching recent completed election results:', error);
      return null;
    }
  }

  // Get election results for home page (different logic than dashboard)
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
              endDate: {
                gte: twentyFourHoursAgo, // Show completed elections within 24 hours
              },
            },
          ],
        },
        include: {
          positions: {
            include: {
              candidates: {
                include: {
                  partylist: true,
                },
              },
            },
          },
        },
        orderBy: { startDate: "desc" },
      });

      const results: ElectionResult[] = [];

      for (const election of elections) {
        const positions = [];

        for (const position of election.positions) {
          const candidates = [];

          for (const candidate of position.candidates) {
            // Ensure partylist exists before accessing its properties
            if (!candidate.partylist) {
              console.warn(`Candidate ${candidate.id} has no partylist`);
              continue;
            }

            // Count votes for this candidate
            const voteCount = await prisma.vote.count({
              where: {
                candidateId: candidate.id,
                positionId: position.id,
                electionId: election.id,
              },
            });

            candidates.push({
              id: candidate.id,
              name: candidate.name,
              avatar: candidate.avatar,
              partylist: candidate.partylist.name,
              votes: voteCount,
            });
          }

          // Sort candidates by vote count
          candidates.sort((a, b) => b.votes - a.votes);

          positions.push({
            id: position.id,
            name: position.name,
            candidates,
          });
        }

        results.push({
          id: election.id,
          name: election.name,
          status: election.status,
          positions,
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching home page election results:', error);
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
