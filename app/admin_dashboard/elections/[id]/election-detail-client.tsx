"use client";

import { CandidatesTab } from "@/app/components/admin/election-detail/candidates-tab";
import { PositionsTab } from "@/app/components/admin/election-detail/positions-tab";
import { ResultsTab } from "@/app/components/admin/election-detail/result-tab";
import { VotersTab } from "@/app/components/admin/election-detail/voter-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  ListIcon,
  UsersIcon,
  VoteIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Election = {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  fullStartDate: string;
  fullEndDate: string;
  status: "INACTIVE" | "ACTIVE" | "COMPLETED";
  candidatesCount: number;
  votersCount: number;
  castVotesCount: number;
  uncastVotesCount: number;
};

export default function ElectionDetailClient({
  election,
}: {
  election: Election;
}) {
  const router = useRouter();

  const getStatusClassName = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500 hover:bg-green-600";
      case "inactive":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "completed":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  // Format status display text
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin_dashboard/elections")}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-black">{election.name}</h1>
        <Badge className={getStatusClassName(election.status)}>
          {formatStatus(election.status)}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Election Details</CardTitle>
          <CardDescription>{election.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date Range</h3>
              <p className="mt-1">
                {formatDate(election.startDate)} -{" "}
                {formatDate(election.endDate)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Time</h3>
              <p className="mt-1">
                {election.startTime} - {election.endTime}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Participation
              </h3>
              <p className="mt-1">
                {election.castVotesCount} of {election.votersCount} votes cast (
                {election.votersCount > 0
                  ? Math.round(
                      (election.castVotesCount / election.votersCount) * 100
                    )
                  : 0}
                %)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="positions">
            <ListIcon className="h-4 w-4 mr-2" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="voters">
            <UsersIcon className="h-4 w-4 mr-2" />
            Voters
          </TabsTrigger>
          <TabsTrigger value="candidates">
            <VoteIcon className="h-4 w-4 mr-2" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="results">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <PositionsTab electionId={election.id} />
        </TabsContent>

        <TabsContent value="voters">
          <VotersTab electionId={election.id} />
        </TabsContent>

        <TabsContent value="candidates">
          <CandidatesTab electionId={election.id} />
        </TabsContent>

        <TabsContent value="results">
          <ResultsTab electionId={election.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
