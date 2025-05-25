import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ElectionDetailClient from "./election-detail-client";
import { ElectionStatus } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  // Await params before accessing properties (Next.js 15 requirement)
  const { id } = await params;
  const electionId = Number(id);

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

    // Map database status to the expected client status
    const status = election.status as "INACTIVE" | "ACTIVE" | "COMPLETED";

    const formattedElection = {
      id: election.id,
      name: election.name,
      description: election.description,
      startDate: election.startDate.toISOString(),
      endDate: election.endDate.toISOString(),
      startTime: election.startDate.toLocaleTimeString(),
      endTime: election.endDate.toLocaleTimeString(),
      fullStartDate: election.startDate.toISOString(),
      fullEndDate: election.endDate.toISOString(),
      status,
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
