"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerkAuth } from "@/hooks/use-clerk-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { BallotClientWrapper } from "@/app/components/ballot/ballot-client-wrapper";

export default function BallotPage() {
  const router = useRouter();
  const { user, isLoaded, isLoading, isVoter, error } = useClerkAuth();
  const [positions, setPositions] = useState([]);
  const [electionName, setElectionName] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isLoaded && !isLoading && isVoter) {
      // Redirect if voter has already cast their vote
      if (user?.status === "CAST") {
        router.push("/thank-you");
        return;
      }

      // Fetch ballot data
      fetchBallotData();
    }
  }, [isLoaded, isLoading, isVoter, user, router]);

  const fetchBallotData = async () => {
    try {
      setLoadingData(true);
      const response = await fetch("/api/elections/active");
      const data = await response.json();
      
      if (data.election && data.positions) {
        setElectionName(data.election.name);
        setPositions(data.positions);
      }
    } catch (error) {
      console.error("Failed to fetch ballot data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Remove the redirect for non-voters since useClerkAuth now handles that

  if (!isLoaded || isLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          <p className="text-sm text-gray-500">Loading your ballot...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push("/sign-in")}>
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVoter) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unauthorized</AlertTitle>
              <AlertDescription>
                You do not have permission to access the ballot. Only registered
                voters can access this page.
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push("/sign-in")}>Back to Sign In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.status === "CAST") {
    // This should have been caught by the useEffect, but just in case
    router.push("/thank-you");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-teal-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Ballot
          </h1>
          <p className="text-sm text-gray-600">
            Cast your vote for the {electionName || "current election"}
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <BallotClientWrapper positions={positions} electionName={electionName} />
        </div>
      </div>
    </div>
  );
}