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
import { ElectionResult } from "@/lib/data/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatarSvg } from "@/app/components/ui/user-avatar-svg";

// Function to generate consistent avatar URL for candidates without avatars
function getCandidateAvatar(candidateId: number, candidateName: string) {
  const styles = ["adventurer", "avataaars", "micah"];
  const style = styles[candidateId % styles.length];
  const seed = candidateName.toLowerCase().replace(/\s+/g, "");
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

// Function to generate anonymous avatar when names are hidden
function getAnonymousAvatar(candidateId: number) {
  const styles = ["bottts", "identicon", "shapes"];
  const style = styles[candidateId % styles.length];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=anonymous-${candidateId}`;
}

// Number of positions to show per page
const POSITIONS_PER_PAGE = 10;

export default function VoterPage() {
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const [electionData, setElectionData] = useState<ElectionResult[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [minimizedPositions, setMinimizedPositions] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isTogglingHideName, setIsTogglingHideName] = useState(false);

  const selectedElection = electionData.find(
    (e: ElectionResult) => e.id.toString() === selectedElectionId
  );

  // Check if names should be hidden
  const hideNames = selectedElection?.hideName ?? false;

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

  // Fetch election results data
  useEffect(() => {
    const fetchElectionResults = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/results");
        if (response.ok) {
          const results: ElectionResult[] = await response.json();
          setElectionData(results);

          // Set the first election as selected if available
          if (results.length > 0 && !selectedElectionId) {
            setSelectedElectionId(results[0].id.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching election results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchElectionResults();
  }, [selectedElectionId]);

  // Reset to page 1 when changing elections
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedElectionId]);

  // Real-time vote updates (fetch fresh data every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/dashboard/results");
        if (response.ok) {
          const results: ElectionResult[] = await response.json();
          setElectionData(results);
        }
      } catch (error) {
        console.error("Error updating election results:", error);
      }
    }, 30000); // Update every 30 seconds

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

  // Toggle hide name functionality
  const toggleHideName = async () => {
    if (!selectedElectionId) return;

    setIsTogglingHideName(true);
    try {
      const response = await fetch(
        `/api/elections/${selectedElectionId}/toggle-hide-name`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Refresh the election data to get the updated hideName status
        const refreshResponse = await fetch("/api/dashboard/results");
        if (refreshResponse.ok) {
          const results: ElectionResult[] = await refreshResponse.json();
          setElectionData(results);
        }
      } else {
        console.error("Failed to toggle hide name status");
      }
    } catch (error) {
      console.error("Error toggling hide name status:", error);
    } finally {
      setIsTogglingHideName(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-1">
        <div className="container mx-auto">
          <div className="mb-2 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-7 w-48" />
            <div className="flex flex-wrap items-center gap-1">
              <Skeleton className="h-7 w-[180px]" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
          <div className="mb-1">
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="py-1 px-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="p-1">
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 3 }).map((_, candidateIndex) => (
                      <div
                        key={candidateIndex}
                        className="rounded-md border p-1 shadow-sm"
                      >
                        <div className="mb-1 flex items-center gap-1">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-3 w-16 flex-1" />
                        </div>
                        <div className="mb-0.5 flex items-center justify-between">
                          <Skeleton className="h-2 w-8" />
                          <Skeleton className="h-2 w-6" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (electionData.length === 0) {
    return (
      <div className="w-full">
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="text-lg text-gray-500">No elections found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-1 ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}
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

            {!isFullscreen && selectedElection && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={toggleHideName}
                  disabled={isTogglingHideName}
                >
                  {isTogglingHideName ? (
                    <>
                      <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      Updating...
                    </>
                  ) : hideNames ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Show Names
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide Names
                    </>
                  )}
                </Button>
              </div>
            )}

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
            <h2 className="text-sm font-semibold text-foreground">
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
                                {!hideNames && candidate.avatar ? (
                                  <img
                                    src={candidate.avatar}
                                    alt={
                                      hideNames ? "Anonymous" : candidate.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserAvatarSvg
                                    name={
                                      hideNames ? "Anonymous" : candidate.name
                                    }
                                    size={24}
                                    hideName={hideNames}
                                    className="h-full w-full"
                                  />
                                )}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                {!hideNames && (
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
