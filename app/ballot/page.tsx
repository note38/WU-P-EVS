import { BallotForm } from "@/app/components/ballot/ballot-form";
import { BallotHeader } from "@/app/components/ballot/ballot-header";
import { getElectionForVoterByEmail } from "@/lib/data/elections";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function BallotPage() {
  // Get the current user from Clerk
  const user = await currentUser();

  // Redirect if not logged in
  if (!user) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/ballot"));
  }

  // For now, let's comment out the user type check since we're using email-based lookup
  // This will allow any authenticated user to try to access the ballot

  // Check if user is a voter (you'll need to adapt this based on how you store user roles in Clerk)
  // Option 1: Check user metadata
  // const userType = user.publicMetadata?.userType || user.privateMetadata?.userType;

  // Option 2: Check user email or other identifier to determine role
  // const userType = determineUserTypeFromEmail(user.emailAddresses[0]?.emailAddress);

  // Temporarily disabled to avoid redirect loops
  // if (userType !== "voter") {
  //   redirect("/sign-in?redirect_url=" + encodeURIComponent("/ballot"));
  // }

  // Get the voter's election using their email address
  // Since we don't have clerkId in the voter table, we'll find the voter by email
  const userEmail = user.emailAddresses[0]?.emailAddress;
  if (!userEmail) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/ballot"));
  }

  console.log("Looking up election for voter email:", userEmail);
  const election = await getElectionForVoterByEmail(userEmail);

  // If no election found, show a proper error instead of redirecting to sign-in
  if (!election) {
    console.log("No election found for voter:", userEmail);
    // Instead of redirecting to sign-in, show an error message with header
    return (
      <div className="min-h-screen bg-background">
        <BallotHeader />
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-4">
              No active election found for your account ({userEmail}).
            </p>
            <p className="text-sm text-gray-500">
              Please contact your administrator if you believe this is an error.
            </p>
          </div>
        </main>
      </div>
    );
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
    <div className="min-h-screen bg-background">
      <BallotHeader />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-2">{election.name}</h1>
        <p className="text-center text-muted-foreground mb-8">
          Please vote for each position
        </p>
        <BallotForm positions={positions} electionName={election.name} />
      </main>
    </div>
  );
}
