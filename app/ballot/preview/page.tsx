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
import { BallotHeader } from "@/app/components/ballot/ballot-header";

export default function PreviewPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    // Clean up old localStorage data
    localStorage.removeItem("ballotPositions");

    // Get selections from localStorage
    const storedSelections = localStorage.getItem("ballotSelections");

    if (storedSelections) {
      setSelections(JSON.parse(storedSelections));
    } else {
      // If no selections found, redirect back to ballot
      router.push("/ballot");
      return;
    }

    // Fetch current election positions instead of using localStorage positions
    fetchCurrentElectionPositions();
  }, [router]);

  const fetchCurrentElectionPositions = async () => {
    try {
      console.log("Fetching current election positions...");
      const response = await fetch("/api/elections/active");

      console.log("Election API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to fetch current election positions:",
          response.status,
          errorText
        );
        alert(
          `Failed to load election data (Error ${response.status}). Please try again.`
        );
        router.push("/ballot");
        return;
      }

      const data = await response.json();
      console.log("Election API response data:", data);

      if (data.error) {
        console.error("API returned error:", data.error);
        alert(`Failed to load election data: ${data.error}. Please try again.`);
        router.push("/ballot");
        return;
      }

      if (data.positions) {
        setPositions(data.positions);

        // Get the current selections from localStorage
        const storedSelections = localStorage.getItem("ballotSelections");
        const currentSelections = storedSelections
          ? JSON.parse(storedSelections)
          : {};

        // Filter selections to only include valid positions from current election
        const validPositionIds = new Set(data.positions.map((p: any) => p.id));
        const filteredSelections: Record<string, string> = {};

        Object.keys(currentSelections).forEach((positionId) => {
          if (validPositionIds.has(positionId)) {
            filteredSelections[positionId] = currentSelections[positionId];
          } else {
            console.warn(
              `Removing invalid position ${positionId} from selections`
            );
          }
        });

        // Update selections state with filtered selections
        if (
          Object.keys(filteredSelections).length !==
          Object.keys(currentSelections).length
        ) {
          setSelections(filteredSelections);
        }
      } else {
        console.error(
          "Failed to fetch current election positions - no positions in response"
        );
        alert("Failed to load election data. Please try again.");
        router.push("/ballot");
      }
    } catch (error) {
      console.error("Error fetching election positions:", error);
      alert("Network error while loading election data. Please try again.");
      router.push("/ballot");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // Validate that all selections are for valid positions
    const validPositionIds = new Set(positions.map((p) => p.id));
    const invalidSelections = Object.keys(selections).filter(
      (positionId) => !validPositionIds.has(positionId)
    );

    if (invalidSelections.length > 0) {
      console.error("Invalid position IDs in selections:", invalidSelections);
      alert(
        `Your ballot contains invalid positions: ${invalidSelections.join(", ")}. These have been removed. Please review your ballot and try again.`
      );
      setSubmitting(false);
      return;
    }

    // Skip validation for missing selections since the UI only shows positions
    // that have selections (filtered by year level).

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

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse the error response
        let errorData;
        try {
          const text = await response.text();
          console.log("Raw error response text:", text);
          if (text) {
            errorData = JSON.parse(text);
            console.log("Parsed error data:", errorData);
          } else {
            console.log("No error response body received");
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }

        // Log for debugging - this is expected behavior when voter has already voted
        console.log(
          "Ballot submission response (may be expected error):",
          response.status,
          response.statusText,
          errorData
        );

        // Handle specific error cases
        if (response.status === 400) {
          // Bad request - likely validation error
          let displayedMessage =
            "Failed to submit ballot due to validation errors. Please review your selections and try again.";

          if (errorData && errorData.message) {
            displayedMessage = errorData.message;
          } else if (errorData && errorData.error) {
            // Check if it's the "already voted" error
            if (
              typeof errorData.error === "string" &&
              (errorData.error.includes("already voted") ||
                errorData.error.includes("Voter has already voted"))
            ) {
              displayedMessage = "You have already submitted your ballot.";
            } else {
              displayedMessage = `Validation error: ${errorData.error}. Please review your selections and try again.`;
            }
          } else {
            // Default message for already voted case based on logs
            displayedMessage = "You have already submitted your ballot.";
          }

          alert(displayedMessage);
          console.log("Displayed error message to user:", displayedMessage);

          // If this is the "already voted" case, this is expected behavior, not an error
          if (displayedMessage === "You have already submitted your ballot.") {
            console.log(
              "Info: Voter attempted to submit ballot again after already voting. This is expected behavior."
            );
          }
        } else if (response.status === 401) {
          alert("Your session has expired. Please sign in again.");
          // Optionally redirect to sign in
        } else if (response.status === 404) {
          alert("Voter information not found. Please contact support.");
        } else {
          alert(
            `Failed to submit ballot. Server returned status ${response.status}. Please try again.`
          );
        }

        setSubmitting(false);
        return;
      }

      const result = await response.json();

      // Log the full response for debugging
      console.log("Ballot submission response:", response.status, result);

      if (result.success) {
        // Clear localStorage
        localStorage.removeItem("ballotSelections");
        localStorage.removeItem("ballotPositions");

        // Redirect to thank you page first
        router.replace("/ballot/thank-you");

        // Sign out the user in the background after a short delay
        setTimeout(async () => {
          try {
            await signOut();
          } catch (err) {
            console.log("Session already clear or error clearing session");
          }
        }, 1000);
      } else {
        // Show a user-friendly error message
        let errorMessage =
          "Failed to submit ballot. Please review your selections and try again.";

        // Use the specific message from the API if available
        if (result.message && typeof result.message === "string") {
          errorMessage = result.message;
        } else if (result.error && typeof result.error === "string") {
          // Fallback to error if message not provided
          errorMessage = result.error;
        }

        // Show error in a more user-friendly way
        alert(errorMessage);
        console.error("Ballot submission failed:", result);
        setSubmitting(false);
      }
    } catch (error: any) {
      console.error("Network error submitting ballot:", error);

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        alert(
          "Failed to connect to the server. Please check your internet connection and try again."
        );
      } else {
        alert(
          `An unexpected error occurred: ${error.message || "Unknown error"}. Please try again.`
        );
      }

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

    // Navigate back to the ballot page with a parameter to indicate which position to edit
    router.push(`/ballot?editPosition=${positionId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BallotHeader />
      <main className="flex-grow container mx-auto py-8 px-4 overflow-y-auto pb-32">
        <h1 className="text-3xl font-bold text-center mb-2">
          Review Your Ballot
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Please review your selections before final submission
        </p>

        {/* Instructions card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Review Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please carefully review all your selections below. If you need to make changes, 
              click the "Edit" button next to each position. When you're satisfied with your 
              selections, scroll to the bottom and click "Submit Ballot".
            </p>
          </CardContent>
        </Card>

        {/* Make the container scrollable for long ballots with fixed footer */}
        <div className="max-w-3xl mx-auto space-y-6">
          {positions
            .filter((position) => selections[position.id])
            .map((position) => {
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
                          <h3 className="font-medium">
                            {selectedCandidate.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedCandidate.party}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSelection(position.id)}
                        className="flex items-center whitespace-nowrap"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          
          {/* Additional information card to demonstrate scrolling */}
          <Card>
            <CardHeader>
              <CardTitle>Important Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Once you submit your ballot, you will be automatically signed out for security purposes.
              </p>
              <p className="text-sm text-muted-foreground">
                Your vote is anonymous and cannot be traced back to you. The system only records that you have voted.
              </p>
            </CardContent>
          </Card>
          
          {/* More content to ensure scrolling is necessary */}
          <Card>
            <CardHeader>
              <CardTitle>Election Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This ballot is for the official student council election. All votes are final and cannot be changed after submission.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Fixed footer for action buttons to ensure visibility on mobile */}
      <div className="max-w-3xl mx-auto pt-6 fixed bottom-0 left-0 right-0 bg-background p-4 border-t z-10">
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
    </div>
  );
}
