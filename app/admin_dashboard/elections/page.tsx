"use client";

import { useState } from "react";
import { CreateElectionForm } from "@/app/components/admin/election-detail/create-election-form";
import { ElectionCard } from "@/app/components/admin/election-detail/election-card";
import { SearchInput } from "@/app/components/admin/search-input";

// Sample elections data
const elections = [
  {
    id: 1,
    name: "Presidential Election 2023",
    startDate: "2023-06-15T08:00:00",
    endDate: "2023-06-16T20:00:00",
    status: "active",
    candidates: 4,
    voters: 5000,
    castVotes: 4195,
    uncastVotes: 805,
  },
  {
    id: 2,
    name: "City Council Election",
    startDate: "2023-07-10T09:00:00",
    endDate: "2023-07-11T18:00:00",
    status: "scheduled",
    candidates: 12,
    voters: 3500,
    castVotes: 0,
    uncastVotes: 3500,
  },
  {
    id: 3,
    name: "Student Body Election",
    startDate: "2023-05-01T10:00:00",
    endDate: "2023-05-02T16:00:00",
    status: "completed",
    candidates: 8,
    voters: 1200,
    castVotes: 918,
    uncastVotes: 282,
  },
  {
    id: 4,
    name: "Board of Directors Election",
    startDate: "2023-08-20T08:00:00",
    endDate: "2023-08-25T17:00:00",
    status: "draft",
    candidates: 6,
    voters: 50,
    castVotes: 0,
    uncastVotes: 50,
  },
  {
    id: 5,
    name: "Neighborhood Association",
    startDate: "2023-09-05T09:00:00",
    endDate: "2023-09-06T17:00:00",
    status: "scheduled",
    candidates: 5,
    voters: 250,
    castVotes: 0,
    uncastVotes: 250,
  },
  {
    id: 6,
    name: "School Board Election",
    startDate: "2023-04-10T08:00:00",
    endDate: "2023-04-11T20:00:00",
    status: "completed",
    candidates: 7,
    voters: 1800,
    castVotes: 1350,
    uncastVotes: 450,
  },
];

export default function ElectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredElections = elections.filter(
    (election) =>
      election.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">
          Elections Management
        </h1>
        <CreateElectionForm />
      </div>

      <SearchInput
        placeholder="Search elections by name or status..."
        value={searchTerm}
        onChange={setSearchTerm}
        className="max-w-md"
      />

      {filteredElections.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">
            No elections found matching "{searchTerm}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredElections.map((election) => (
            <ElectionCard key={election.id} election={election} />
          ))}
        </div>
      )}
    </div>
  );
}
