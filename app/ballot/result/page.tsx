"use client";

import { logoutVoter } from "@/action/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Position } from "@/types/ballot";
import { Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultsPage() {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Get selections and positions from localStorage
    const storedSelections = localStorage.getItem("ballotSelections");
    const storedPositions = localStorage.getItem("ballotPositions");

    if (storedSelections && storedPositions) {
      setSelections(JSON.parse(storedSelections));
      setPositions(JSON.parse(storedPositions));
    } else {
      // If no selections found, redirect back to ballot
      router.push("/ballot");
    }
    setLoading(false);
  }, [router]);

  const handleDone = async () => {
    setSubmitting(true);
    try {
      // Clear localStorage
      localStorage.removeItem("ballotSelections");
      localStorage.removeItem("ballotPositions");

      // Log out the voter
      await logoutVoter();

      // Will be redirected by the logout function
    } catch (error) {
      console.error("Error logging out:", error);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">Loading...</div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">
        Thank You For Voting
      </h1>
      <p className="text-center mb-8 text-muted-foreground">
        Your ballot has been submitted successfully
      </p>

      <div className="max-w-3xl mx-auto space-y-6 mb-8">
        {positions.map((position: Position) => {
          const selectedCandidateId = selections[position.id];
          const selectedCandidate = position.candidates.find(
            (c) => c.id === selectedCandidateId
          );

          if (!selectedCandidate) return null;

          return (
            <Card key={position.id}>
              <CardHeader>
                <CardTitle>{position.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border">
                    <Image
                      src={selectedCandidate.avatar || "/placeholder.svg"}
                      alt={selectedCandidate.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {selectedCandidate.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCandidate.party}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="max-w-3xl mx-auto flex justify-center">
        <Button
          onClick={handleDone}
          disabled={submitting}
          className="flex items-center"
        >
          <Check className="mr-2 h-4 w-4" />
          {submitting ? "Processing..." : "Done"}
        </Button>
      </div>
    </main>
  );
}
