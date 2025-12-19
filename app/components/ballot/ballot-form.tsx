"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Position } from "@/types/ballot";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PositionSelection } from "@/app/components/ballot/position-selection";

interface BallotFormProps {
  positions: Position[];
  electionName: string;
  editPositionId?: string;
}

export function BallotForm({
  positions: initialPositions,
  electionName,
  editPositionId,
}: BallotFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [positions, setPositions] = useState<Position[]>(
    initialPositions || []
  );
  const [isLoading, setIsLoading] = useState(
    !initialPositions || initialPositions.length === 0
  );

  useEffect(() => {
    // Only fetch positions if none were provided via props
    if (!initialPositions || initialPositions.length === 0) {
      async function fetchPositions() {
        try {
          setIsLoading(true);
          const response = await fetch("/api/positions");
          const data = await response.json();
          if (data.positions) {
            setPositions(data.positions);
          }
        } catch (error) {
          console.error("Failed to fetch positions:", error);
        } finally {
          setIsLoading(false);
        }
      }
      fetchPositions();
    }

    // Load selections from localStorage if available
    const storedSelections = localStorage.getItem("ballotSelections");
    if (storedSelections) {
      setSelections(JSON.parse(storedSelections));
    }
  }, [initialPositions]);

  useEffect(() => {
    // If we're editing a specific position, find its index and navigate to it
    if (editPositionId && positions.length > 0) {
      const positionIndex = positions.findIndex((p) => p.id === editPositionId);
      if (positionIndex !== -1) {
        setCurrentPositionIndex(positionIndex);
      }
    }
  }, [editPositionId, positions]);

  // Safety check to ensure we have positions
  if (positions.length === 0 && !isLoading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-lg">No positions available for voting.</p>
      </div>
    );
  }

  // Make sure we have a current position with fallback values
  const currentPosition = positions[currentPositionIndex] || null;
  const isFirstPosition = currentPositionIndex === 0;
  const isLastPosition = currentPositionIndex === positions.length - 1;

  const handleSelection = (positionId: string, candidateId: string) => {
    setSelections((prev) => ({
      ...prev,
      [positionId]: candidateId,
    }));

    // Enable the Next button immediately when a selection is made
    // This ensures the button becomes active right away on mobile
    setTimeout(() => {
      const nextButton = document.querySelector(
        "button.flex.items-center.ml-2"
      );
      if (nextButton) {
        nextButton.removeAttribute("disabled");
      }
    }, 100);
  };

  const goToNextPosition = () => {
    if (currentPositionIndex < positions.length - 1) {
      setCurrentPositionIndex(currentPositionIndex + 1);
    }
  };

  const goToPreviousPosition = () => {
    if (currentPositionIndex > 0) {
      setCurrentPositionIndex(currentPositionIndex - 1);
    }
  };

  const handleReview = () => {
    // Check if all positions have selections
    const allSelected = positions.every((position) => selections[position.id]);

    if (!allSelected) {
      // Find the first position without a selection
      const firstMissingIndex = positions.findIndex(
        (position) => !selections[position.id]
      );
      if (firstMissingIndex >= 0) {
        setCurrentPositionIndex(firstMissingIndex);
        alert(
          `Please select a candidate for ${positions[firstMissingIndex].title || positions[firstMissingIndex].id}`
        );
      }
      return;
    }

    // Store selections and positions in localStorage
    localStorage.setItem("ballotSelections", JSON.stringify(selections));
    localStorage.setItem("ballotPositions", JSON.stringify(positions));

    // Redirect to preview page
    router.push("/ballot/preview");
  };

  const handleBackToReview = () => {
    // Store current selections before navigating back
    localStorage.setItem("ballotSelections", JSON.stringify(selections));
    router.push("/ballot/preview");
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-lg">Loading ballot...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-8 font-sans">
      <h2 className="text-xl font-bold mb-4 text-center">{electionName}</h2>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Position {currentPositionIndex + 1} of {positions.length}
          </span>
          <span className="text-sm font-medium">
            {Math.round(((currentPositionIndex + 1) / positions.length) * 100)}%
            Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{
              width: `${((currentPositionIndex + 1) / positions.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Make the card container scrollable for long content */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {currentPosition && (
          <Card className="mb-6 w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center sm:text-2xl">
                {currentPosition.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <PositionSelection
                position={currentPosition}
                selectedCandidate={selections[currentPosition.id] || ""}
                onSelect={(candidateId: string) =>
                  handleSelection(currentPosition.id, candidateId)
                }
              />
            </CardContent>
            {/* Fixed footer for action buttons to ensure visibility on mobile/Safari */}
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 sticky bottom-0 bg-card pt-4 border-t">
              {editPositionId ? (
                // If editing from review page, show back to review button
                <Button
                  onClick={handleBackToReview}
                  className="w-full sm:w-auto flex items-center"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Review
                </Button>
              ) : (
                // Normal navigation buttons
                <>
                  <Button
                    variant="outline"
                    onClick={goToPreviousPosition}
                    disabled={isFirstPosition}
                    className="w-full sm:w-auto flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {isLastPosition ? (
                    <Button
                      onClick={handleReview}
                      disabled={
                        !positions.every((position) => selections[position.id])
                      }
                      className="w-full sm:w-auto flex items-center justify-center"
                    >
                      Review Ballot
                    </Button>
                  ) : (
                    <Button
                      onClick={goToNextPosition}
                      disabled={!selections[currentPosition.id]}
                      className="w-full sm:w-auto flex items-center justify-center"
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
