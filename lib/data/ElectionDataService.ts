import { prisma } from "@/lib/db";
import { ElectionStatus } from "@prisma/client";
import { AccelerateInfo } from "@prisma/extension-accelerate";

export interface ElectionData {
  id: number;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: ElectionStatus;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    positions: number;
    partylists: number;
    voters: number;
    votes: number;
  };
}

export interface AccelerateResult<T> {
  data: T;
  info: AccelerateInfo | null;
}

export class ElectionDataService {
  // Get all elections
  static async getElections(): Promise<AccelerateResult<ElectionData[]>> {
    const result = await prisma.election.findMany({
      include: {
        _count: {
          select: {
            positions: true,
            partylists: true,
            voters: true,
            votes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: result,
      info: null, // Accelerate info is available on the prisma client level
    };
  }

  // Get active elections
  static async getActiveElections(): Promise<AccelerateResult<ElectionData[]>> {
    const now = new Date();

    const result = await prisma.election.findMany({
      where: {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        _count: {
          select: {
            positions: true,
            partylists: true,
            voters: true,
            votes: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return {
      data: result,
      info: null, // Accelerate info is available on the prisma client level
    };
  }

  // Get a specific election by ID
  static async getElectionById(id: number): Promise<ElectionData | null> {
    return prisma.election.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            positions: true,
            partylists: true,
            voters: true,
            votes: true,
          },
        },
      },
    });
  }

  // Create a new election
  static async createElection(data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    status: ElectionStatus;
    createdById: number;
  }) {
    return prisma.election.create({
      data,
    });
  }

  // Update an election
  static async updateElection(
    id: number,
    data: Partial<Omit<ElectionData, "id" | "createdAt" | "updatedAt">>
  ) {
    return prisma.election.update({
      where: { id },
      data,
    });
  }

  // Delete an election
  static async deleteElection(id: number) {
    return prisma.$transaction(async (tx: any) => {
      // Delete all votes for this election first
      await tx.vote.deleteMany({
        where: { electionId: id },
      });

      // Delete all candidates for this election
      await tx.candidate.deleteMany({
        where: { electionId: id },
      });

      // Delete all positions for this election
      await tx.position.deleteMany({
        where: { electionId: id },
      });

      // Delete all partylists for this election
      await tx.partylist.deleteMany({
        where: { electionId: id },
      });

      // Finally, delete the election itself
      return tx.election.delete({
        where: { id },
      });
    });
  }
}
