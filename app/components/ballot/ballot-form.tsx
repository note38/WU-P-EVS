"use client";

import { PositionSelection } from "@/app/components/ballot/position-selection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Position } from "@/types/ballot";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BallotFormProps {
  positions: Position[];
  electionName: string;
}

export function BallotForm({
  positions: initialPositions,
  electionName,
}: BallotFormProps) {
  const router = useRouter();
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
  }, [initialPositions]);

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

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-lg">Loading ballot...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
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
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
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
                className="w-full sm:w-auto flex items-center"
              >
                Review Ballot
              </Button>
            ) : (
              <Button
                onClick={goToNextPosition}
                disabled={!selections[currentPosition.id]}
                className="w-full sm:w-auto flex items-center"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}