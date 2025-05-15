import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ElectionDetailClient from "./election-detail-client";

// This is a server component that fetches data
export default async function ElectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const electionId = Number(params.id);

  if (isNaN(electionId)) {
    notFound();
  }

  try {
    // Fetch the election with related counts
    const election = await prisma.election.findUnique({
      where: {
        id: electionId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        _count: {
          select: {
            positions: true,
            voters: true,
            votes: true,
          },
        },
        positions: {
          select: {
            _count: {
              select: {
                candidates: true,
              },
            },
          },
        },
      },
    });

    if (!election) {
      notFound();
    }

    // Calculate totals
    const candidatesCount = election.positions.reduce(
      (total, position) => total + position._count.candidates,
      0
    );

    const votersCount = election._count.voters;
    const castVotesCount = election._count.votes;
    const uncastVotesCount = votersCount - castVotesCount;

    const formattedElection = {
      id: election.id,
      name: election.name,
      description: election.description,
      startDate: election.startDate.toISOString(),
      endDate: election.endDate.toISOString(),
      startTime: election.startDate.toLocaleTimeString(),
      endTime: election.endDate.toLocaleTimeString(),
      fullStartDate: election.startDate.toISOString(), // Convert to string instead of passing Date object
      fullEndDate: election.endDate.toISOString(), // Convert to string instead of passing Date object
      status: election.status,
      candidatesCount,
      votersCount,
      castVotesCount,
      uncastVotesCount,
    };

    // Pass the data to the client component
    return <ElectionDetailClient election={formattedElection} />;
  } catch (error) {
    console.error("Error fetching election:", error);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          Error loading election
        </h1>
        <p className="mt-2">
          There was a problem fetching the election details.
        </p>
      </div>
    );
  }
}
