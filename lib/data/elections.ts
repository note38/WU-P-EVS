import { prisma } from "@/lib/db";
import { Candidate, Election, Position } from "@/types/ballot";

export async function getActiveElections() {
  const currentDate = new Date();

  const activeElections = await prisma.election.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: currentDate },
      endDate: { gte: currentDate },
    },
    include: {
      positions: {
        include: {
          candidates: {
            include: {
              partylist: true,
            },
          },
          year: true, // Include year information for position filtering
        },
      },
    },
  });

  return activeElections.map(mapToElectionType);
}

export async function getElectionById(id: string) {
  const election = await prisma.election.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      positions: {
        include: {
          candidates: {
            include: {
              partylist: true,
            },
          },
          year: true, // Include year information for position filtering
        },
      },
    },
  });

  if (!election) {
    return null;
  }

  return mapToElectionType(election);
}

export async function getElectionForVoter(voterId: string) {
  const voter = await prisma.voter.findUnique({
    where: {
      id: Number(voterId),
    },
    include: {
      election: {
        where: {
          status: "ACTIVE", // Only include active elections
        },
        include: {
          positions: {
            include: {
              candidates: {
                include: {
                  partylist: true,
                },
              },
              year: true, // Include year information for position filtering
            },
          },
        },
      },
      year: true, // Include voter's year information
    },
  });

  if (!voter || !voter.election) {
    return null;
  }

  // Filter positions based on voter's year
  const filteredPositions = voter.election.positions.filter((position) => {
    // If position has no year restriction (yearId is null), it's available to all voters
    if (!position.yearId) return true;
    // If position has a year restriction, only show it to voters in that year
    return position.yearId === voter.yearId;
  });

  // Create a copy of the election with filtered positions
  const electionWithFilteredPositions = {
    ...voter.election,
    positions: filteredPositions,
  };

  return mapToElectionType(electionWithFilteredPositions);
}

export async function getElectionForVoterByEmail(email: string) {
  const voter = await prisma.voter.findUnique({
    where: {
      email: email,
    },
    include: {
      election: {
        where: {
          status: "ACTIVE", // Only include active elections
        },
        include: {
          positions: {
            include: {
              candidates: {
                include: {
                  partylist: true,
                },
              },
              year: true, // Include year information for position filtering
            },
          },
        },
      },
      year: true, // Include voter's year information
    },
  });

  if (!voter || !voter.election) {
    return null;
  }

  // Filter positions based on voter's year
  const filteredPositions = voter.election.positions.filter((position) => {
    // If position has no year restriction (yearId is null), it's available to all voters
    if (!position.yearId) return true;
    // If position has a year restriction, only show it to voters in that year
    return position.yearId === voter.yearId;
  });

  // Create a copy of the election with filtered positions
  const electionWithFilteredPositions = {
    ...voter.election,
    positions: filteredPositions,
  };

  return mapToElectionType(electionWithFilteredPositions);
}

function mapToElectionType(election: any): Election {
  return {
    id: String(election.id),
    name: election.name,
    description: election.description || "",
    status: election.status,
    startDate: election.startDate,
    endDate: election.endDate,
    positions: election.positions.map(
      (position: any): Position => ({
        id: String(position.id),
        title: position.name,
        candidates: position.candidates.map(
          (candidate: any): Candidate => ({
            id: String(candidate.id),
            name: candidate.name,
            avatar: candidate.avatar,
            party: candidate.partylist.name,
          })
        ),
      })
    ),
  };
}
