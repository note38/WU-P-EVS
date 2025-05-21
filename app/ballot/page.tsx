import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { BallotForm } from "@/app/components/ballot/ballot-form";
import { getElectionForVoter } from "@/lib/data/elections";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function BallotPage() {
  // Mock data with party information
  const mockElection = {
    id: "1",
    name: "Student Council Elections 2024",
    description: "Annual student council elections",
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    positions: [
      {
        id: "101",
        title: "President",
        description: "Head of the student council",
        candidates: [
          {
            id: "1001",
            name: "Alex Johnson",
            bio: "3rd year Computer Science major",
            party: "STEM Party",
          },
          {
            id: "1002",
            name: "Sam Lee",
            bio: "2nd year Political Science major",
            party: "Humanities Alliance",
          },
        ],
      },
      {
        id: "102",
        title: "Vice President",
        description: "Supports the president",
        candidates: [
          {
            id: "1003",
            name: "Taylor Smith",
            bio: "2nd year Business major",
            party: "Business Coalition",
          },
          {
            id: "1004",
            name: "Jordan Brown",
            bio: "3rd year Economics major",
            party: "Economic Reform Party",
          },
        ],
      },
      {
        id: "103",
        title: "Treasurer",
        description: "Manages student council finances",
        candidates: [
          {
            id: "1005",
            name: "Casey White",
            bio: "3rd year Accounting major",
            party: "Financial Responsibility Party",
          },
        ],
      },
    ],
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">
        {mockElection.name}
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Please vote for each position
      </p>
      <BallotForm
        positions={mockElection.positions}
        electionName={mockElection.name}
      />
    </main>
  );
}
