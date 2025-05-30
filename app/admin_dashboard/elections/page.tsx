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
import { ElectionPageClient } from "@/app/admin_dashboard/elections/election-page-client";

// Remove caching and use direct data fetch
const getElectionsData = async () => {
  return await prisma.election.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      status: true,
      createdAt: true,
      partylists: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          positions: true,
          voters: true,
          votes: true,
        },
      },
      voters: {
        select: {
          status: true,
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
  });
};

// Async Election List Component
async function ElectionList() {
  const elections = await getElectionsData();

  if (elections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg text-muted-foreground">No elections available</p>
        <p className="text-sm text-muted-foreground">
          Create a new election to get started
        </p>
      </div>
    );
  }

  const formattedElections = elections.map((election) => {
    // Calculate total candidates by summing up the candidates in each position
    const candidates = election.positions.reduce(
      (total, position) => total + position._count.candidates,
      0
    );

    const totalVoters = election._count.voters;
    // Count voters with VOTED status
    const castVotes = election.voters.filter(
      (voter) => voter.status === "VOTED"
    ).length;
    // Count voters with REGISTERED status
    const uncastVotes = election.voters.filter(
      (voter) => voter.status === "REGISTERED"
    ).length;

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
      partyList: election.partylists.map((p) => p.name),
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {formattedElections.map((election) => (
        <ElectionCard key={election.id} election={election} />
      ))}
    </div>
  );
}

export default async function ElectionsPage() {
  return (
    <ElectionPageClient>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Elections</h1>
            <p className="text-muted-foreground">
              Manage and monitor all elections
            </p>
          </div>
          <CreateElectionForm />
        </div>

        <Suspense fallback={<ElectionStatsSkeleton />}>
          <ElectionStats />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>All Elections</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ElectionCardsSkeleton />}>
              <ElectionList />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </ElectionPageClient>
  );
}
