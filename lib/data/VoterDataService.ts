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
  credentialsSent: boolean;
  createdAt: Date;
  election: { name: string; id: number };
  year: { name: string; id: number };
}

export interface StatsResult {
  totalRegistered: number;
  votedCount: number;
  notVotedCount: number;
  credentialsSentCount: number;
  newRegistrations: number;
}

export interface AccelerateResult<T> {
  data: T;
  info: AccelerateInfo | null;
}

export class VoterDataService {
  // Get all voters with pagination
  static async getVoters(): Promise<AccelerateResult<VoterData[]>> {
    const result = await prisma.voter
      .findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
          email: true,
          status: true,
          avatar: true,
          credentialsSent: true,
          createdAt: true,
          election: { select: { name: true, id: true } },
          year: { select: { name: true, id: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      .withAccelerateInfo();

    return result as AccelerateResult<VoterData[]>;
  }

  // Get voter statistics
  static async getStats(): Promise<AccelerateResult<StatsResult>> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalRegistered,
      votedCount,
      notVotedCount,
      credentialsSentCount,
      newRegistrations,
    ] = await Promise.all([
      prisma.voter.count().withAccelerateInfo(),
      prisma.voter
        .count({
          where: { status: "VOTED" },
        })
        .withAccelerateInfo(),
      prisma.voter
        .count({
          where: { status: "REGISTERED" },
        })
        .withAccelerateInfo(),
      prisma.voter
        .count({
          where: { credentialsSent: true },
        })
        .withAccelerateInfo(),
      prisma.voter
        .count({
          where: {
            createdAt: {
              gte: oneWeekAgo,
            },
          },
        })
        .withAccelerateInfo(),
    ]);

    return {
      data: {
        totalRegistered: totalRegistered.data,
        votedCount: votedCount.data,
        notVotedCount: notVotedCount.data,
        credentialsSentCount: credentialsSentCount.data,
        newRegistrations: newRegistrations.data,
      },
      info:
        totalRegistered.info ||
        votedCount.info ||
        notVotedCount.info ||
        credentialsSentCount.info ||
        newRegistrations.info,
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
    credentialsSent?: boolean;
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
    return prisma.voter.delete({
      where: { id },
    });
  }
}
