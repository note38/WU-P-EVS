"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Position } from "@/types/ballot";
import { ChevronLeft, Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PreviewPage() {
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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Submit the ballot
      const response = await fetch("/api/ballot/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selections,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Clear localStorage
        localStorage.removeItem("ballotSelections");
        localStorage.removeItem("ballotPositions");

        // Redirect to thank you page
        router.push("/ballot/thank-you");
      } else {
        alert(result.error || "Failed to submit ballot. Please try again.");
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting ballot:", error);
      alert("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/ballot");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">Loading...</div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">
        Review Your Ballot
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Please review your selections before final submission
      </p>

      <div className="max-w-3xl mx-auto space-y-6">
        {positions.map((position) => {
          const selectedCandidate = position.candidates.find(
            (c) => c.id === selections[position.id]
          );

          if (!selectedCandidate) return null;

          return (
            <Card key={position.id}>
              <CardHeader>
                <CardTitle>{position.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                    <Image
                      src={selectedCandidate.avatar || "/placeholder.svg"}
                      alt={selectedCandidate.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedCandidate.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCandidate.party}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
            disabled={submitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Ballot
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center"
          >
            <Check className="mr-2 h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Ballot"}
          </Button>
        </div>
      </div>
    </main>
  );
}
