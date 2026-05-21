import { prisma } from "@/lib/db";
import { VoterStatus } from "@prisma/client";
import { AccelerateInfo } from "@prisma/extension-accelerate";

export interface VoterData {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  status: VoterStatus;
  avatar: string;
  createdAt: Date;
  election: { name: string; id: number } | null;
  year: {
    name: string;
    id: number;
    department: {
      id: number;
      name: string;
      image: string | null;
    };
  } | null;
}

export interface StatsResult {
  totalRegistered: number;
  votedCount: number;
  notVotedCount: number;
  newRegistrations: number;
}

export interface AccelerateResult<T> {
  data: T;
  info: AccelerateInfo | null;
}

export class VoterDataService {
  // Get all voters with pagination
  static async getVoters(): Promise<AccelerateResult<VoterData[]>> {
    const result = await prisma.voter.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
        status: true,
        avatar: true,
        createdAt: true,
        election: { select: { name: true, id: true } },
        year: {
          select: {
            name: true,
            id: true,
            program: {
              select: {
                id: true,
                name: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to preserve the legacy { year: { department } } structure for UI compatibility
    const mappedResult: VoterData[] = result.map((voter) => ({
      id: voter.id,
      firstName: voter.firstName,
      lastName: voter.lastName,
      middleName: voter.middleName,
      email: voter.email,
      status: voter.status,
      avatar: voter.avatar,
      createdAt: voter.createdAt,
      election: voter.election,
      year: voter.year
        ? {
            id: voter.year.id,
            name: voter.year.name,
            department: voter.year.program
              ? {
                  id: voter.year.program.department.id,
                  name: voter.year.program.department.name,
                  image: voter.year.program.department.image,
                }
              : { id: 0, name: "Unassigned", image: null },
          }
        : null,
    }));

    return {
      data: mappedResult,
      info: null, // Accelerate info is available on the prisma client level
    };
  }

  // Get voter statistics
  static async getStats(): Promise<AccelerateResult<StatsResult>> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [totalRegistered, votedCount, notVotedCount, newRegistrations] =
      await Promise.all([
        prisma.voter.count(),
        prisma.voter.count({
          where: { status: "CAST" },
        }),
        prisma.voter.count({
          where: { status: "UNCAST" },
        }),
        prisma.voter.count({
          where: {
            createdAt: {
              gte: oneWeekAgo,
            },
          },
        }),
      ]);

    return {
      data: {
        totalRegistered,
        votedCount,
        notVotedCount,
        newRegistrations,
      },
      info: null, // Accelerate info is available on the prisma client level
    };
  }

  // Create a voter
  static async createVoter(voterData: {
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    hashpassword: string;
    avatar: string;
    electionId: number;
    yearId: number;
    status?: VoterStatus;
  }) {
    return prisma.voter.create({
      data: voterData,
    });
  }

  // Update voter status
  static async updateVoterStatus(id: number, status: VoterStatus) {
    return prisma.voter.update({
      where: { id },
      data: { status },
    });
  }

  // Delete voter
  static async deleteVoter(id: number) {
    // First delete any votes associated with this voter to avoid foreign key constraint violation
    await prisma.vote.deleteMany({
      where: { voterId: id },
    });

    return prisma.voter.delete({
      where: { id },
    });
  }
}
