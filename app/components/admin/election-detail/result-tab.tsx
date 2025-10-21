"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DownloadIcon,
  PrinterIcon,
  MailIcon,
  TrophyIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { printElectionResults, validatePrintData } from "@/lib/print-utils";
import { exportElectionResults, validateExportData } from "@/lib/export-utils";
import { formatDateTime, calculatePercentage } from "@/lib/print-templates";
import type {
  ElectionDetails,
  Candidate,
  Position,
  ResultsTabProps,
} from "@/types/election-results";
import { useElectionAutoStatus } from "@/hooks/use-election-auto-status";
import { useRouter } from "next/navigation";

export function ResultsTab({ electionId }: ResultsTabProps) {
  const { user } = useUser();
  const router = useRouter();
  const [electionDetails, setElectionDetails] =
    useState<ElectionDetails | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [isAnnouncingResults, setIsAnnouncingResults] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [userPosition, setUserPosition] = useState<string>("");

  // Use the auto status hook to check for election status updates
  const { manualCheck } = useElectionAutoStatus({
    enabled: false, // We'll manually trigger checks
    onStatusUpdate: (updates) => {
      if (updates && updates.length > 0) {
        // Check if our current election was updated
        const currentElectionUpdated = updates.some(
          (update) => update.id === electionId
        );

        if (currentElectionUpdated) {
          toast({
            title: "Election Status Changed",
            description:
              "The election status has been updated. Refreshing data...",
          });

          // Refetch the election data
          fetchResults();
        }
      }
    },
  });

  // Fetch user position data
  useEffect(() => {
    const fetchUserPosition = async () => {
      try {
        const response = await fetch("/api/users/profile");
        if (response.ok) {
          const profileData = await response.json();
          setUserPosition(profileData.position || "Administrator");
        }
      } catch (error) {
        console.error("Failed to load user position:", error);
        setUserPosition("Administrator"); // Fallback
      }
    };

    fetchUserPosition();
  }, []);

  // Fetch election results data
  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/elections/${electionId}/results`);

      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const data = await response.json();
      setElectionDetails(data.election);
      setPositions(data.positions);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast({
        title: "Error",
        description: "Failed to load election results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Run initial fetch and manual status check
  useEffect(() => {
    fetchResults();
    manualCheck();
  }, [electionId, manualCheck]);

  // Handle print results
  const handlePrintResults = async () => {
    if (!electionDetails || !positions.length) {
      toast({
        title: "Error",
        description: "No results data available to print",
        variant: "destructive",
      });
      return;
    }

    setIsPrinting(true);

    try {
      const printOptions = {
        electionDetails,
        positions: filteredPositions,
        currentUser: user,
        userPosition,
      };

      // Validate data before printing
      const validation = validatePrintData(printOptions);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Print using utility function
      await printElectionResults(printOptions);

      toast({
        title: "Success",
        description: "Print dialog opened successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error printing results:", error);
      toast({
        title: "Error",
        description: `Failed to print results: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Handle export results
  const handleExportResults = async () => {
    if (!electionDetails || !positions.length) {
      toast({
        title: "Error",
        description: "No results data available to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const exportOptions = {
        electionDetails,
        positions: filteredPositions,
      };

      // Validate data before exporting
      const validation = validateExportData(exportOptions);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Export using utility function
      await exportElectionResults(exportOptions);

      toast({
        title: "Success",
        description: "Results exported successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error exporting results:", error);
      toast({
        title: "Error",
        description: `Failed to export results: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Filter positions based on selection
  const filteredPositions = positions.filter((position) => {
    if (selectedPosition === "all") return true;
    if (selectedPosition === "winner-result") {
      return position.candidates.length > 0 && position.candidates[0].votes > 0;
    }
    return position.name.toLowerCase().includes(selectedPosition.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading results...</span>
      </div>
    );
  }

  if (!electionDetails) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No election data found.</p>
      </div>
    );
  }

  const startDateTime = formatDateTime(electionDetails.startDate);
  const endDateTime = formatDateTime(electionDetails.endDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Election Results</h2>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintResults}
            disabled={isPrinting || loading}
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PrinterIcon className="h-4 w-4 mr-2" />
            )}
            {isPrinting ? "Preparing..." : "Print Results"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExportResults}
            disabled={isExporting || loading}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <DownloadIcon className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Exporting..." : "Export Results"}
          </Button>
        </div>
      </div>

      {/* Election Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Election Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Election Name:</span>
                <span>{electionDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Election Start:</span>
                <span>
                  {startDateTime.date} {startDateTime.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Election End:</span>
                <span>
                  {endDateTime.date} {endDateTime.time}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Positions:</span>
                <span>{electionDetails.positions}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Candidates:</span>
                <span>{electionDetails.candidates}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Voters:</span>
                <span>{electionDetails.voters}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Casted Votes:</span>
                <span className="text-green-600 font-semibold">
                  {electionDetails.castedVotes}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Uncasted Votes:</span>
                <span className="text-orange-600 font-semibold">
                  {electionDetails.uncastedVotes}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge
                  variant={
                    electionDetails.status === "ACTIVE"
                      ? "default"
                      : electionDetails.status === "COMPLETED"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {electionDetails.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={selectedPosition}
                  onValueChange={setSelectedPosition}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    <SelectItem value="winner-result">
                      Winner Results Only
                    </SelectItem>
                    {positions.map((position) => (
                      <SelectItem
                        key={position.id}
                        value={position.name.toLowerCase()}
                      >
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-3/4">
          <div className="space-y-6">
            {filteredPositions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No results found for the selected filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPositions.map((position) => (
                <Card key={position.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <TrophyIcon className="h-5 w-5" />
                        {position.name}
                      </span>
                      <Badge variant="outline">
                        {position.totalVotes} total votes
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {position.candidates.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No candidates for this position
                        </p>
                      ) : (
                        position.candidates.map((candidate, index) => {
                          const percentage = calculatePercentage(
                            candidate.votes,
                            position.totalVotes
                          );
                          const isWinner = index === 0 && candidate.votes > 0;

                          return (
                            <div
                              key={candidate.id}
                              className={`p-4 rounded-lg border ${isWinner ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700" : "bg-gray-50 dark:bg-gray-800 dark:border-gray-700"}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={
                                        electionDetails.hideName
                                          ? undefined
                                          : candidate.avatar || undefined
                                      }
                                      alt={
                                        electionDetails.hideName
                                          ? "Anonymous"
                                          : candidate.name
                                      }
                                    />
                                    <AvatarFallback>
                                      {electionDetails.hideName
                                        ? "?"
                                        : candidate.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold">
                                        {electionDetails.hideName
                                          ? "Anonymous"
                                          : candidate.name}
                                      </h4>
                                      {isWinner && (
                                        <Badge
                                          variant="default"
                                          className="bg-green-600"
                                        >
                                          Winner
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {electionDetails.hideName
                                        ? "Hidden"
                                        : candidate.partylist}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-lg">
                                    {candidate.votes}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {percentage}%
                                  </div>
                                </div>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for the label
function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium mb-1.5">{children}</div>;
}
