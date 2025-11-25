"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Position } from "@/types/ballot";
import { ChevronLeft, Check, Edit } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PreviewPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

        // Sign out the user and redirect to homepage
        try {
          await signOut();
        } catch (err) {
          console.log("Session already clear or error clearing session");
        }

        // Redirect to homepage
        router.push("/");
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

  const handleConfirmSubmit = () => {
    setShowConfirmation(true);
  };

  const handleBack = () => {
    router.push("/ballot");
  };

  const handleEditSelection = (positionId: string) => {
    // Save current selections to localStorage
    localStorage.setItem("ballotSelections", JSON.stringify(selections));
    localStorage.setItem("ballotPositions", JSON.stringify(positions));

    // Navigate back to the ballot page with a parameter to indicate which position to edit
    router.push(`/ballot?editPosition=${positionId}`);
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

      {/* Make the container scrollable for long ballots */}
      <div className="max-w-3xl mx-auto space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
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
                <div className="flex items-center justify-between">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSelection(position.id)}
                    className="flex items-center"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fixed footer for action buttons */}
      <div className="max-w-3xl mx-auto pt-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center w-full sm:w-auto"
            disabled={submitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Ballot
          </Button>

          <Button
            onClick={handleConfirmSubmit}
            disabled={submitting}
            className="flex items-center w-full sm:w-auto"
          >
            <Check className="mr-2 h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Ballot"}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Ballot Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your ballot? Once submitted, you
              cannot change your selections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Confirm Submission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
