"use client";

import { BallotForm } from "@/app/components/ballot/ballot-form";
import { VotingGuide } from "@/app/components/ballot/voting-guide";
import { useState, useEffect } from "react";
import { type Position } from "@/types/ballot";
import { useSearchParams } from "next/navigation";

export function BallotClientWrapper({
  positions,
  electionName,
}: {
  positions: Position[];
  electionName: string;
}) {
  const [showGuide, setShowGuide] = useState(true);
  const searchParams = useSearchParams();
  const editPosition = searchParams.get("editPosition");

  useEffect(() => {
    // If we're editing a specific position, hide the guide
    if (editPosition) {
      setShowGuide(false);
    }
  }, [editPosition]);

  return (
    <>
      {showGuide && <VotingGuide onContinue={() => setShowGuide(false)} />}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        <BallotForm
          positions={positions}
          electionName={electionName}
          editPositionId={editPosition || undefined}
        />
      </div>
    </>
  );
}
