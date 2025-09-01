"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import { ElectionCard } from "@/app/components/admin/election-detail/election-card";
import { ElectionStats } from "@/app/components/admin/election-detail/election-stats";
import { CreateElectionForm } from "@/app/components/admin/election-detail/create-election-form";
import { Suspense, useEffect, useState } from "react";
import {
  ElectionCardsSkeleton,
  ElectionStatsSkeleton,
} from "@/app/components/ui/skeleton";
import { ElectionPageClient } from "@/app/admin_dashboard/elections/election-page-client";

type Election = {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  partylists: Array<{ id: number; name: string }>;
  _count: {
    positions: number;
    voters: number;
    votes: number;
  };
  voters: Array<{ status: string }>;
  positions: Array<{
    _count: {
      candidates: number;
    };
  }>;
  createdBy: {
    username: string;
  };
};

// Client Election List Component
function ElectionList() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/elections");

        if (response.ok) {
          const data = await response.json();
          setElections(data);
        } else {
          setError("Failed to load elections");
        }
      } catch (err) {
        setError("Failed to load elections");
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  if (loading) {
    return <ElectionCardsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg text-red-500">Failed to load elections</p>
      </div>
    );
  }

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

    // Format dates for display
    const formatDateTime = (date: Date) => {
      return date.toISOString();
    };

    return {
      id: election.id,
      name: election.name,
      description: election.description,
      status: election.status.toLowerCase(),
      candidates,
      voters: totalVoters, // Use voters instead of totalVoters
      castVotes,
      uncastVotes,
      fullStartDate: formatDateTime(startDateObj), // Use fullStartDate as string
      fullEndDate: formatDateTime(endDateObj), // Use fullEndDate as string
      partyList: election.partylists.map((p) => p.name), // Convert partylists to partyList
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {formattedElections.map((election) => (
        <ElectionCard key={election.id} election={election} />
      ))}
    </div>
  );
}

// Main Page Component
export default function ElectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Elections</h1>
        <CreateElectionForm />
      </div>

      <Suspense fallback={<ElectionStatsSkeleton />}>
        <ElectionStats />
      </Suspense>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Elections</h2>
        </div>
        <Suspense fallback={<ElectionCardsSkeleton />}>
          <ElectionList />
        </Suspense>
      </div>
    </div>
  );
}
