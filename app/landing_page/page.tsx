"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useState } from "react";
import { Footer } from "../components/landing_page/navigation/Footer";
import { Header } from "../components/landing_page/navigation/Header";

// Function to get random avatar
function getRandomAvatar(seed: string | undefined) {
  const styles = [
    "adventurer",
    "avataaars",
    "bottts",
    "identicon",
    "initials",
    "micah",
  ];
  // Use a hash of the seed to consistently select a style
  const hash = seed
    ? seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : 0;
  const style = styles[hash % styles.length];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed || "default"}`;
}

// Generate mock data for multiple elections
const generateElections = () => {
  const electionTypes = [
    {
      id: "student-council-2024",
      name: "Student Council Election 2024",
      date: "May 15, 2024",
      status: "active" as const,
      description:
        "Election for the main student council positions for the 2024-2025 academic year.",
    },
    {
      id: "club-officers-2024",
      name: "Club Officers Election 2024",
      date: "April 10, 2024",
      status: "completed" as const,
      description:
        "Election for various club officer positions for the 2024-2025 academic year.",
    },
    {
      id: "class-representatives-2024",
      name: "Class Representatives Election 2024",
      date: "June 5, 2024",
      status: "upcoming" as const,
      description: "Election for class representatives from each grade level.",
    },
    {
      id: "special-committees-2024",
      name: "Special Committees Election 2024",
      date: "March 20, 2024",
      status: "completed" as const,
      description:
        "Election for members of special committees and project teams.",
    },
  ];

  return electionTypes.map((election) => {
    // Generate positions based on election type
    let positionTitles: string[] = [];

    if (election.id === "student-council-2024") {
      positionTitles = [
        "President",
        "Vice President",
        "Secretary",
        "Treasurer",
        "Auditor",
        "Public Relations Officer",
        "Grade 12 Representative",
        "Grade 11 Representative",
        "Grade 10 Representative",
        "Grade 9 Representative",
        "Grade 8 Representative",
        "Grade 7 Representative",
        "Sports Coordinator",
        "Arts Coordinator",
        "Events Coordinator",
        "Student Welfare Officer",
        "Academic Affairs Officer",
        "Discipline Committee Head",
        "Student Council Adviser",
        "Social Media Manager",
      ];
    } else if (election.id === "club-officers-2024") {
      positionTitles = [
        "Science Club President",
        "Science Club Vice President",
        "Science Club Secretary",
        "Math Club President",
        "Math Club Vice President",
        "Math Club Secretary",
        "Debate Team Captain",
        "Debate Team Co-Captain",
        "Music Club President",
        "Music Club Vice President",
        "Drama Club President",
        "Drama Club Vice President",
        "Environmental Club President",
        "Environmental Club Secretary",
        "Technology Club President",
        "Technology Club Vice President",
        "Art Club President",
        "Art Club Secretary",
        "Chess Club President",
        "Chess Club Vice President",
      ];
    } else if (election.id === "class-representatives-2024") {
      positionTitles = [
        "Grade 12-A Representative",
        "Grade 12-B Representative",
        "Grade 12-C Representative",
        "Grade 11-A Representative",
        "Grade 11-B Representative",
        "Grade 11-C Representative",
        "Grade 10-A Representative",
        "Grade 10-B Representative",
        "Grade 10-C Representative",
        "Grade 9-A Representative",
        "Grade 9-B Representative",
        "Grade 9-C Representative",
        "Grade 8-A Representative",
        "Grade 8-B Representative",
        "Grade 8-C Representative",
        "Grade 7-A Representative",
        "Grade 7-B Representative",
        "Grade 7-C Representative",
        "Grade 6-A Representative",
        "Grade 6-B Representative",
      ];
    } else if (election.id === "special-committees-2024") {
      positionTitles = [
        "Yearbook Committee Head",
        "Yearbook Design Lead",
        "Yearbook Content Editor",
        "Prom Committee Chair",
        "Prom Committee Co-Chair",
        "Prom Decorations Lead",
        "Sports Festival Coordinator",
        "Sports Festival Assistant",
        "Academic Fair Head",
        "Academic Fair Assistant",
        "Community Service Lead",
        "Community Service Assistant",
        "School Paper Editor-in-Chief",
        "School Paper Managing Editor",
        "School Paper Layout Artist",
        "Cultural Festival Chair",
        "Cultural Festival Co-Chair",
        "Fundraising Committee Head",
        "Alumni Relations Officer",
        "Student Mentorship Program Lead",
      ];
    }

    // Generate positions with candidates
    const positions = positionTitles.map((title, index) => {
      // Generate 2-4 candidates per position in a deterministic way to avoid hydration mismatch
      const candidateCount = ((election.id.length + index) % 3) + 2; // 2 to 4 candidates
      const candidates = [];

      for (let i = 0; i < candidateCount; i++) {
        const names = [
          "Alex Johnson",
          "Sam Williams",
          "Taylor Smith",
          "Jordan Lee",
          "Casey Brown",
          "Riley Davis",
          "Morgan Wilson",
          "Quinn Thomas",
          "Avery Martinez",
          "Jamie Garcia",
          "Drew Anderson",
          "Parker Lewis",
          "Blake Murphy",
          "Cameron White",
          "Dakota Green",
          "Emerson Hall",
          "Finley Clark",
          "Harper Young",
          "Jordan Allen",
          "Kennedy Scott",
          "Logan Baker",
          "Madison Evans",
          "Noah Phillips",
          "Olivia Carter",
          "Peyton Morris",
          "Quinn Nelson",
          "Riley Cooper",
          "Sydney Reed",
          "Taylor Hill",
          "Zoe Mitchell",
        ];

        // Use a combination of election id, position index and candidate index to pick a name
        // This ensures we don't reuse the same name for multiple positions
        const nameIndex = (election.id.length + index * 5 + i) % names.length;

        // Generate deterministic votes based on name and position to prevent hydration errors
        const seed = (nameIndex + 1) * (index + 1) * (i + 1);
        candidates.push({
          id: index * 10 + i + 1,
          name: names[nameIndex],
          votes:
            election.status === "upcoming" ? 0 : Math.floor((seed % 80) + 20), // 20 to 100 votes, 0 if upcoming
          avatarUrl: getRandomAvatar(names[nameIndex].replace(/\s+/g, "")),
        });
      }

      return {
        title,
        candidates,
      };
    });

    // Calculate total votes per position to determine percentages
    const positionsWithPercentages = positions.map((position) => {
      const totalVotes = position.candidates.reduce(
        (sum, candidate) => sum + candidate.votes,
        0
      );
      return {
        ...position,
        totalVotes,
        candidates: position.candidates.map((candidate) => ({
          ...candidate,
          percentage:
            totalVotes === 0
              ? 0
              : Math.round((candidate.votes / totalVotes) * 100),
        })),
      };
    });

    return {
      ...election,
      positions: positionsWithPercentages,
    };
  });
};

const elections = generateElections();

function getStatusColor(status: "active" | "completed" | "upcoming") {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "completed":
      return "bg-blue-500";
    case "upcoming":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}

interface Election {
  id: string;
  name: string;
  date: string;
  status: "active" | "completed" | "upcoming";
  description: string;
  positions: Array<{
    title: string;
    candidates: Array<{
      id: number;
      name: string;
      votes: number;
      avatarUrl: string;
      percentage: number;
    }>;
    totalVotes: number;
  }>;
}

function ElectionSelector({
  elections,
  currentElection,
  onElectionChange,
}: {
  elections: Election[];
  currentElection: Election;
  onElectionChange: (election: Election) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Election</h3>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {elections.map((election) => (
          <Card
            key={election.id}
            className={`cursor-pointer transition-all hover:border-primary ${
              currentElection.id === election.id
                ? "border-2 border-primary"
                : ""
            }`}
            onClick={() => onElectionChange(election)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{election.name}</CardTitle>
                <Badge className={getStatusColor(election.status)}>
                  {election.status.charAt(0).toUpperCase() +
                    election.status.slice(1)}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {election.date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {election.description}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                {election.positions.length} positions •{" "}
                {election.positions.reduce(
                  (sum, pos) => sum + pos.candidates.length,
                  0
                )}{" "}
                candidates
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PositionSelector({
  positions,
  electionStatus,
}: {
  positions: Election["positions"];
  electionStatus: Election["status"];
}) {
  const [currentPosition, setCurrentPosition] = useState(positions[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const positionsPerPage = 10;

  // Filter positions based on search query
  const filteredPositions = searchQuery
    ? positions.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : positions;

  // Calculate total pages
  const totalPages = Math.ceil(filteredPositions.length / positionsPerPage);

  // Get positions for current page
  const startIndex = (page - 1) * positionsPerPage;
  const paginatedPositions = filteredPositions.slice(
    startIndex,
    startIndex + positionsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="w-full md:w-72">
          <Select
            value={currentPosition.title.toLowerCase().replace(/\s+/g, "-")}
            onValueChange={(value) => {
              const selected = positions.find(
                (p) => p.title.toLowerCase().replace(/\s+/g, "-") === value
              );
              if (selected) setCurrentPosition(selected);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {positions.map((position) => (
                <SelectItem
                  key={position.title}
                  value={position.title.toLowerCase().replace(/\s+/g, "-")}
                >
                  {position.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {searchQuery ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Search Results</h3>
          {paginatedPositions.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedPositions.map((position) => (
                <Button
                  key={position.title}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => setCurrentPosition(position)}
                >
                  <div className="text-left">
                    <div className="font-medium">{position.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {position.candidates.length} candidates
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No positions found matching "{searchQuery}"
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-4">{currentPosition.title}</h3>
            {electionStatus === "upcoming" ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <p className="text-yellow-800">
                  This election has not started yet. Voting will begin soon and
                  results will be displayed here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {currentPosition.candidates.map((candidate) => (
                  <Card key={candidate.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <span>{candidate.name}</span>
                        <span className="text-lg font-bold text-primary">
                          {candidate.percentage}%
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                          <img
                            src={candidate.avatarUrl}
                            alt={candidate.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              Votes: {candidate.votes}
                            </span>
                          </div>
                          <Progress
                            value={candidate.percentage}
                            className={`h-3 ${
                              candidate.percentage > 60
                                ? "bg-green-500"
                                : candidate.percentage > 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              background: "rgba(0,0,0,0.1)",
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">All Positions</h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedPositions.map((position) => (
                <Button
                  key={position.title}
                  variant={
                    position.title === currentPosition.title
                      ? "default"
                      : "outline"
                  }
                  className="justify-start h-auto py-3"
                  onClick={() => setCurrentPosition(position)}
                >
                  <div className="text-left">
                    <div className="font-medium">{position.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {position.candidates.length} candidates
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [currentElection, setCurrentElection] = useState(elections[0]);
  const [showElectionSelector, setShowElectionSelector] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        onSwitchElection={() => setShowElectionSelector(!showElectionSelector)}
      />

      <main className="flex-1 container py-6 md:py-10 m-auto">
        <div className="space-y-6 ">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {currentElection.name}
              </h2>
              <Badge className={getStatusColor(currentElection.status)}>
                {currentElection.status.charAt(0).toUpperCase() +
                  currentElection.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {currentElection.description} • {currentElection.date}
            </p>
          </div>

          {showElectionSelector && (
            <ElectionSelector
              elections={elections}
              currentElection={currentElection}
              onElectionChange={(election) => {
                setCurrentElection(election);
                setShowElectionSelector(false);
              }}
            />
          )}

          {!showElectionSelector && (
            <>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    Total Candidates:{" "}
                    {currentElection.positions.reduce(
                      (sum, pos) => sum + pos.candidates.length,
                      0
                    )}
                  </span>
                </div>
              </div>

              <PositionSelector
                positions={currentElection.positions}
                electionStatus={currentElection.status}
              />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
