"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useEffect, useState } from "react";

// Function to generate random avatar URL
function getRandomAvatar() {
  const styles = [
    "adventurer",
    "avataaars",
    "bottts",
    "identicon",
    "initials",
    "micah",
  ];
  const style = styles[Math.floor(Math.random() * styles.length)];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${Math.random().toString(36).substring(7)}`;
}

// Generate a large number of positions for testing pagination
function generatePositions(count: number) {
  const positions = [];
  const positionTitles = [
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Public Relations Officer",
    "Event Coordinator",
    "Social Media Manager",
    "Community Outreach",
    "Fundraising Chair",
    "Membership Coordinator",
    "Technology Officer",
    "Volunteer Coordinator",
    "Marketing Director",
    "Education Chair",
    "Sustainability Officer",
    "Diversity Chair",
    "Alumni Relations",
    "Sports Coordinator",
    "Arts Director",
    "Health and Wellness Officer",
  ];

  for (let i = 0; i < count; i++) {
    const candidateCount = Math.floor(Math.random() * 3) + 2; // 2-4 candidates per position
    const candidates = [];

    for (let j = 0; j < candidateCount; j++) {
      candidates.push({
        id: i * 10 + j,
        name: `Candidate ${j + 1} for ${positionTitles[i % positionTitles.length]}`,
        votes: Math.floor(Math.random() * 200) + 50,
        avatar: getRandomAvatar(),
      });
    }

    positions.push({
      id: i + 1,
      name:
        positionTitles[i % positionTitles.length] +
        (i >= positionTitles.length
          ? ` ${Math.floor(i / positionTitles.length) + 1}`
          : ""),
      candidates,
    });
  }

  return positions;
}

// Sample election data with many positions
const elections = [
  {
    id: 1,
    name: "Student Council Election 2025",
    positions: generatePositions(15), // 15 positions to test pagination
  },
  {
    id: 2,
    name: "Faculty Board Election 2025",
    positions: generatePositions(8),
  },
  {
    id: 3,
    name: "Homecoming Committee 2025",
    positions: generatePositions(5),
  },
  {
    id: 4,
    name: "Large Election Example",
    positions: generatePositions(50), // 50 positions to test pagination
  },
];

// Number of positions to show per page
const POSITIONS_PER_PAGE = 10;

export default function VoterPage() {
  const [selectedElectionId, setSelectedElectionId] = useState<string>(
    elections[0].id.toString()
  );
  const [electionData, setElectionData] = useState(elections);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [minimizedPositions, setMinimizedPositions] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const selectedElection = electionData.find(
    (e) => e.id.toString() === selectedElectionId
  );

  // Calculate total pages
  const totalPages = selectedElection
    ? Math.ceil(selectedElection.positions.length / POSITIONS_PER_PAGE)
    : 1;

  // Get current positions to display
  const currentPositions = selectedElection
    ? selectedElection.positions.slice(
        (currentPage - 1) * POSITIONS_PER_PAGE,
        currentPage * POSITIONS_PER_PAGE
      )
    : [];

  // Reset to page 1 when changing elections
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedElectionId]);

  // Simulate real-time vote updates
  useEffect(() => {
    const interval = setInterval(() => {
      setElectionData((prevData) =>
        prevData.map((election) => ({
          ...election,
          positions: election.positions.map((position) => ({
            ...position,
            candidates: position.candidates.map((candidate) => ({
              ...candidate,
              votes: Math.max(
                0,
                candidate.votes +
                  (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3)
              ),
            })),
          })),
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Toggle position minimized state
  const toggleMinimize = (id: number) => {
    setMinimizedPositions((prev) =>
      prev.includes(id)
        ? prev.filter((positionId) => positionId !== id)
        : [...prev, id]
    );
  };

  // Calculate total votes for a position
  const getTotalVotes = (candidates: any[]) => {
    return candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
  };

  // Calculate vote percentage
  const calculateVotePercentage = (votes: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div
      className={`min-h-screen  p-1 ${isFullscreen ? "fixed inset-0 z-50 " : ""}`}
    >
      <div className="container mx-auto ">
        <div className="mb-2 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl font-bold">Live Election Results</h1>

          <div className="flex flex-wrap items-center gap-1">
            <Select
              value={selectedElectionId}
              onValueChange={setSelectedElectionId}
            >
              <SelectTrigger className="h-7 w-[180px] text-xs">
                <SelectValue placeholder="Select an election" />
              </SelectTrigger>
              <SelectContent>
                {electionData.map((election) => (
                  <SelectItem
                    key={election.id}
                    value={election.id.toString()}
                    className="text-xs"
                  >
                    {election.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-1">
              <Switch
                id="show-names"
                checked={showNames}
                onCheckedChange={setShowNames}
                className="h-3 w-6"
              />
              <Label
                htmlFor="show-names"
                className="flex items-center gap-1 text-xs"
              >
                {showNames ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
                {showNames ? "Hide" : "Show"}
              </Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {selectedElection && (
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              {selectedElection.name}
            </h2>

            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 2-column, 5-row grid for positions */}
        <div className="grid grid-cols-2 gap-1">
          {currentPositions.map((position) => {
            const isMinimized = minimizedPositions.includes(position.id);
            const totalVotes = getTotalVotes(position.candidates);

            return (
              <Card key={position.id} className="overflow-hidden">
                <CardHeader className=" py-1 px-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs">{position.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => toggleMinimize(position.id)}
                      aria-label={isMinimized ? "Maximize" : "Minimize"}
                    >
                      {isMinimized ? (
                        <Maximize2 className="h-2 w-2" />
                      ) : (
                        <Minimize2 className="h-2 w-2" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {!isMinimized && (
                  <CardContent className="p-1">
                    <div className="grid grid-cols-3 gap-1">
                      {position.candidates.map((candidate) => {
                        const votePercentage = calculateVotePercentage(
                          candidate.votes,
                          totalVotes
                        );

                        return (
                          <div
                            key={candidate.id}
                            className="rounded-md border  p-1 shadow-sm"
                          >
                            <div className="mb-1 flex items-center gap-1">
                              <div className="h-6 w-6 overflow-hidden rounded-full border">
                                <img
                                  src={candidate.avatar || "/placeholder.svg"}
                                  alt={`Avatar for ${candidate.name}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                {showNames && (
                                  <h3 className="truncate text-[10px] font-medium leading-tight">
                                    {candidate.name}
                                  </h3>
                                )}
                              </div>
                            </div>

                            <div className="mb-0.5 flex items-center justify-between">
                              <span className="text-[8px] font-medium text-slate-500">
                                Votes
                              </span>
                              <span className="text-[8px] font-bold">
                                {votePercentage}%
                              </span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  votePercentage > 50
                                    ? "bg-green-500"
                                    : votePercentage > 25
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${votePercentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-2 flex justify-center">
            <div className="flex items-center gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 py-0"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
              <span className="mx-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 py-0"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
