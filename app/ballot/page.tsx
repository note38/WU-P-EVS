import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BallotForm } from "@/components/ballot-form";
import { getElectionForVoter } from "@/lib/data/elections";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export default async function BallotPage() {
  // Get current session
  const session = await getServerSession(authOptions);

  // Check if user is logged in and is a voter
  if (!session || !session.user) {
    redirect("/login?error=not-authenticated");
  }

  // Ensure the user is a voter
  if (session.user.userType !== "voter") {
    redirect("/login?error=not-authorized");
  }

  // Ensure the voter's status is REGISTERED (hasn't voted yet)
  if (session.user.status === "VOTED") {
    redirect("/login?error=already-voted");
  }

  // Get the voter's election
  // Convert voterId to string if getElectionForVoter expects a string
  const voterId = session.user.id;
  const election = await getElectionForVoter(voterId);

  if (!election) {
    redirect("/login?error=no-election-found");
  }

  // Check if the election is active
  if (election.status !== "ACTIVE") {
    redirect("/login?error=election-not-active");
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">{election.name}</h1>
      <p className="text-center text-muted-foreground mb-8">
        Please vote for each position
      </p>
      <BallotForm positions={election.positions} electionName={election.name} />
    </main>
  );
}
