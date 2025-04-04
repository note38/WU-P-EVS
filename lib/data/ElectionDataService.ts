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
    const result = await prisma.election
      .findMany({
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
      })
      .withAccelerateInfo();

    return result as AccelerateResult<ElectionData[]>;
  }

  // Get active elections
  static async getActiveElections(): Promise<AccelerateResult<ElectionData[]>> {
    const now = new Date();

    const result = await prisma.election
      .findMany({
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
      })
      .withAccelerateInfo();

    return result as AccelerateResult<ElectionData[]>;
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
    return prisma.election.delete({
      where: { id },
    });
  }
}
