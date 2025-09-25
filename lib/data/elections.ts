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
            },
          },
        },
      },
    },
  });

  if (!voter || !voter.election) {
    return null;
  }

  return mapToElectionType(voter.election);
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
            },
          },
        },
      },
    },
  });

  if (!voter || !voter.election) {
    return null;
  }

  return mapToElectionType(voter.election);
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
