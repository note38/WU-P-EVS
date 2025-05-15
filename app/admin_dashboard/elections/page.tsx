import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import { ElectionCard } from "@/app/components/admin/election-detail/election-card";
import { ElectionStats } from "@/app/components/admin/election-detail/election-stats";
import { prisma } from "@/lib/db";
import { CreateElectionForm } from "@/app/components/admin/election-detail/create-election-form";
import { Suspense } from "react";
import {
  ElectionCardsSkeleton,
  ElectionStatsSkeleton,
} from "@/app/components/ui/skeleton";
import { unstable_cache } from "next/cache";

// Cached election data fetch
const getElectionsData = unstable_cache(
  async () => {
    return prisma.election.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
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
        createdBy: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      // Enable caching for this query
      cacheStrategy: {
        ttl: 60, // Cache for 60 seconds
        swr: 120, // Stale-while-revalidate for 120 seconds
      },
    });
  },
  ["elections-data"],
  { tags: ["elections"], revalidate: 60 }
);

// Async Election List Component
async function ElectionList() {
  const elections = await getElectionsData();

  const formattedElections = elections.map((election) => {
    // Calculate total candidates by summing up the candidates in each position
    const candidates = election.positions.reduce(
      (total, position) => total + position._count.candidates,
      0
    );

    const totalVoters = election._count.voters;
    const castVotes = election._count.votes;
    const uncastVotes = totalVoters - castVotes;

    // Convert string dates to Date objects if necessary
    const startDateObj = new Date(election.startDate);
    const endDateObj = new Date(election.endDate);

    // Extract date and time components
    const startDate = startDateObj.toISOString().split("T")[0];
    const startTime = startDateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const endDate = endDateObj.toISOString().split("T")[0];
    const endTime = endDateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return {
      id: election.id,
      name: election.name,
      description: election.description || undefined,
      startDate: startDate,
      startTime: startTime,
      endDate: endDate,
      endTime: endTime,
      fullStartDate: startDateObj.toISOString(),
      fullEndDate: endDateObj.toISOString(),
      status: election.status.toLowerCase(),
      candidates,
      voters: totalVoters,
      castVotes,
      uncastVotes,
      createdBy: election.createdBy?.username || "System",
    };
  });

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {formattedElections.map((election) => (
        <ElectionCard key={election.id} election={election} />
      ))}
    </div>
  );
}

// Page Config
export const dynamic = "force-dynamic";
export const revalidate = 60;

export default function ElectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Elections Management</h1>

        {/* Use the CreateElectionForm component */}
        <div className="hidden md:block">
          <CreateElectionForm />
        </div>

        {/* Mobile button - hidden on desktop */}
        <div className="block md:hidden w-full">
          <CreateElectionForm />
        </div>
      </div>

      <Suspense fallback={<ElectionStatsSkeleton />}>
        <ElectionStats />
      </Suspense>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>All Elections</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ElectionCardsSkeleton />}>
            <ElectionList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
