"use client";

import { useState, useEffect } from "react";
import { SearchInput } from "../search-input";
import { CandidateForm } from "./candidate-form";
import { CandidatesTable } from "./candidates-table";

interface CandidatesTabProps {
  electionId: number;
}

export function CandidatesTab({ electionId }: CandidatesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [positions, setPositions] = useState<any[]>([]);
  const [partylists, setPartylists] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

  useEffect(() => {
    fetchPositions();
    fetchPartylists();
    fetchCandidates();
  }, [electionId]);

  const fetchPositions = async () => {
    try {
      const response = await fetch(`/api/elections/${electionId}/positions`);
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  const fetchPartylists = async () => {
    try {
      const response = await fetch(`/api/elections/${electionId}/partylists`);
      if (response.ok) {
        const data = await response.json();
        setPartylists(data);
      }
    } catch (error) {
      console.error("Error fetching partylists:", error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`/api/elections/${electionId}/candidates`);
      if (response.ok) {
        const data = await response.json();
        setCandidates(data);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Election Candidates</h2>
        <CandidateForm
          electionId={electionId}
          positions={positions}
          partylists={partylists}
          onCandidateAdded={fetchCandidates}
        />
      </div>

      <SearchInput
        placeholder="Search candidates by name, position, or party..."
        value={searchTerm}
        onChange={setSearchTerm}
        className="max-w-md"
      />

      <CandidatesTable candidates={candidates} searchTerm={searchTerm} />
    </div>
  );
}
