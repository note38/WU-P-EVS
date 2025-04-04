"use client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftIcon,
  UsersIcon,
  VoteIcon,
  BarChart3Icon,
  ListIcon,
} from "lucide-react";
import { PositionsTab } from "@/app/components/admin/election-detail/positions-tab";
import { CandidatesTab } from "@/app/components/admin/election-detail/candidates-tab";
import { VotersTab } from "@/app/components/admin/election-detail/voter-tab";
import { ResultsTab } from "@/app/components/admin/election-detail/result-tab";

// Sample elections data - in a real app, you would fetch this from an API
const elections = [
  {
    id: 1,
    name: "Presidential Election 2023",
    startDate: "2023-06-15T08:00:00",
    endDate: "2023-06-16T20:00:00",
    status: "active",
    candidates: 4,
    voters: 5000,
    castVotes: 4195,
    uncastVotes: 805,
    description: "National presidential election for the 2023-2027 term.",
  },
  {
    id: 2,
    name: "City Council Election",
    startDate: "2023-07-10T09:00:00",
    endDate: "2023-07-11T18:00:00",
    status: "scheduled",
    candidates: 12,
    voters: 3500,
    castVotes: 0,
    uncastVotes: 3500,
    description: "Election for city council members for the upcoming term.",
  },
  {
    id: 3,
    name: "Student Body Election",
    startDate: "2023-05-01T10:00:00",
    endDate: "2023-05-02T16:00:00",
    status: "completed",
    candidates: 8,
    voters: 1200,
    castVotes: 918,
    uncastVotes: 282,
    description:
      "Annual student body election for university student representatives.",
  },
  {
    id: 4,
    name: "Board of Directors Election",
    startDate: "2023-08-20T08:00:00",
    endDate: "2023-08-25T17:00:00",
    status: "draft",
    candidates: 6,
    voters: 50,
    castVotes: 0,
    uncastVotes: 50,
    description: "Election for the company's board of directors.",
  },
];

export default function ElectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const electionId = Number(params.id);

  // Find the election by ID
  const election = elections.find((e) => e.id === electionId);

  // If election not found, show error
  if (!election) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h1 className="text-2xl font-bold mb-4">Election Not Found</h1>
        <p className="text-gray-500 mb-6">
          The election you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/admin_dashboard/elections")}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Elections
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin_dashboard/elections")}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-primary">{election.name}</h1>
        <Badge
          className={
            election.status === "active"
              ? "bg-green-500 hover:bg-green-600"
              : election.status === "scheduled"
              ? "bg-blue-500 hover:bg-blue-600"
              : election.status === "completed"
              ? "bg-gray-500 hover:bg-gray-600"
              : "bg-yellow-500 hover:bg-yellow-600"
          }
        >
          {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
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
                {new Date(election.startDate).toLocaleDateString()} -{" "}
                {new Date(election.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Time</h3>
              <p className="mt-1">
                {new Date(election.startDate).toLocaleTimeString()} -{" "}
                {new Date(election.endDate).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Participation
              </h3>
              <p className="mt-1">
                {election.castVotes} of {election.voters} votes cast (
                {Math.round((election.castVotes / election.voters) * 100)}%)
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
          <TabsTrigger value="candidates">
            <VoteIcon className="h-4 w-4 mr-2" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="voters">
            <UsersIcon className="h-4 w-4 mr-2" />
            Voters
          </TabsTrigger>
          <TabsTrigger value="results">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <PositionsTab electionId={election.id} />
        </TabsContent>

        <TabsContent value="candidates">
          <CandidatesTab electionId={election.id} />
        </TabsContent>

        <TabsContent value="voters">
          <VotersTab electionId={election.id} />
        </TabsContent>

        <TabsContent value="results">
          <ResultsTab electionId={election.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
