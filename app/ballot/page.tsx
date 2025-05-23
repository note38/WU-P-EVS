import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { BallotForm } from "@/app/components/ballot/ballot-form";
import { getElectionForVoter } from "@/lib/data/elections";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function BallotPage() {
  // Get the user session
  const session = await getServerSession(authOptions);

  // Redirect if not logged in or not a voter
  if (!session || !session.user || session.user.userType !== "voter") {
    redirect("/login");
  }

  // Get the voter's election
  const election = await getElectionForVoter(session.user.id);

  // Redirect if no election found
  if (!election) {
    redirect("/login");
  }

  // Transform positions to the format expected by BallotForm
  const positions = election.positions.map((position) => ({
    id: position.id,
    title: position.title,
    description: position.description || "",
    candidates: position.candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party,
      avatar: candidate.avatar || "/placeholder.svg",
    })),
  }));

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">{election.name}</h1>
      <p className="text-center text-muted-foreground mb-8">
        Please vote for each position
      </p>
      <BallotForm positions={positions} electionName={election.name} />
    </main>
  );
}
