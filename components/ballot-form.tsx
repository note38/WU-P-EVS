"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { PositionSelection } from "@/components/position-selection";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Position } from "@/types/ballot";
import { submitBallot } from "@/action/ballot";

interface BallotFormProps {
  positions: Position[];
  electionName: string;
}

export function BallotForm({ positions, electionName }: BallotFormProps) {
  const router = useRouter();
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPosition = positions[currentPositionIndex];
  const isFirstPosition = currentPositionIndex === 0;
  const isLastPosition = currentPositionIndex === positions.length - 1;

  // Store positions in localStorage for use in results page
  useEffect(() => {
    localStorage.setItem("ballotPositions", JSON.stringify(positions));
  }, [positions]);

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

  const handleSubmit = async () => {
    // Check if all positions have selections
    const allSelected = positions.every((position) => selections[position.id]);

    if (!allSelected) {
      // Find the first position without a selection
      const firstMissingIndex = positions.findIndex(
        (position) => !selections[position.id]
      );
      if (firstMissingIndex >= 0) {
        setCurrentPositionIndex(firstMissingIndex);
        setError(
          `Please select a candidate for ${positions[firstMissingIndex].name}`
        );
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Store selections in localStorage to access in results page
      localStorage.setItem("ballotSelections", JSON.stringify(selections));

      // Submit ballot to database
      const result = await submitBallot(selections);

      if (result.success) {
        router.push("/ballot/result");
      } else {
        setError(result.message || "Failed to submit ballot");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while submitting your ballot");
      setIsSubmitting(false);
    }
  };

  // Guard against empty positions array or undefined currentPosition
  if (!positions.length || !currentPosition) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              No positions available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">
              There are no positions available for voting at this time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {currentPosition.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PositionSelection
            position={currentPosition}
            selectedCandidate={selections[currentPosition.id] || ""}
            onSelect={(candidateId) =>
              handleSelection(currentPosition.id, candidateId)
            }
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousPosition}
            disabled={isFirstPosition || isSubmitting}
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {isLastPosition ? (
            <Button
              onClick={handleSubmit}
              disabled={
                !positions.every((position) => selections[position.id]) ||
                isSubmitting
              }
              className="flex items-center"
            >
              {isSubmitting ? "Submitting..." : "Review Ballot"}
            </Button>
          ) : (
            <Button
              onClick={goToNextPosition}
              disabled={!selections[currentPosition.id] || isSubmitting}
              className="flex items-center"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
