"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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

interface ElectionDetails {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  positions: number;
  candidates: number;
  voters: number;
  castedVotes: number;
  uncastedVotes: number;
}

interface Candidate {
  id: number;
  name: string;
  avatar: string | null;
  partylist: string;
  votes: number;
}

interface Position {
  id: number;
  name: string;
  maxCandidates: number;
  candidates: Candidate[];
  totalVotes: number;
}

interface ResultsTabProps {
  electionId: number;
}

export function ResultsTab({ electionId }: ResultsTabProps) {
  const { data: session } = useSession();
  const [electionDetails, setElectionDetails] =
    useState<ElectionDetails | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [isAnnouncingResults, setIsAnnouncingResults] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch election results data
  useEffect(() => {
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

    fetchResults();
  }, [electionId]);

  // Handle email announcement
  const handleAnnounceResults = async () => {
    try {
      setIsAnnouncingResults(true);
      const response = await fetch(
        `/api/elections/${electionId}/announce-results`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to announce results");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Results announced to ${data.stats.successful} voters successfully!`,
      });
    } catch (error) {
      console.error("Error announcing results:", error);
      toast({
        title: "Error",
        description: "Failed to announce results via email",
        variant: "destructive",
      });
    } finally {
      setIsAnnouncingResults(false);
    }
  };

  // Handle print results
  const handlePrintResults = () => {
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
      const startDateTime = formatDateTime(electionDetails.startDate);
      const endDateTime = formatDateTime(electionDetails.endDate);
      const currentUser = session?.user;

      // Create print content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>   </title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .election-details { 
              margin-bottom: 30px; 
              background: #f9f9f9; 
              padding: 15px; 
              border-radius: 5px;
            }
            .election-details h3 { 
              margin-top: 0; 
              color: #1f2937;
            }
            .details-grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 15px; 
            }
            .detail-item { 
              display: flex; 
              justify-content: space-between; 
              padding: 5px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .position-card { 
              margin-bottom: 25px; 
              border: 1px solid #ddd; 
              border-radius: 5px;
              page-break-inside: avoid;
            }
            .position-header { 
              background: #f0f0f0; 
              padding: 15px; 
              font-weight: bold; 
              font-size: 18px;
              border-bottom: 1px solid #ddd;
            }
            .candidate { 
              padding: 10px 15px; 
              border-bottom: 1px solid #eee; 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
            }
            .candidate:last-child { 
              border-bottom: none; 
            }
            .winner { 
              background: #f0f9ff; 
              font-weight: bold;
            }
            .candidate-info { 
              flex: 1; 
            }
            .candidate-name { 
              font-weight: bold; 
              margin-bottom: 3px;
            }
            .candidate-party { 
              color: #666; 
              font-size: 14px;
            }
            .vote-info { 
              text-align: right; 
            }
            .votes { 
              font-size: 18px; 
              font-weight: bold;
            }
            .percentage { 
              color: #666; 
              font-size: 14px;
            }
            .winner-badge { 
              background: #10b981; 
              color: white; 
              padding: 2px 8px; 
              border-radius: 12px; 
              font-size: 12px;
              margin-left: 10px;
            }
            .proofread-section {
              margin-top: 40px;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background: #f9f9f9;
              page-break-inside: avoid;
            }
            .proofread-title {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 15px;
              color: #1f2937;
            }
            .signature-line {
              margin-top: 30px;
              border-bottom: 1px solid #333;
              width: 300px;
              height: 40px;
              position: relative;
            }
            .signature-info {
              margin-top: 10px;
              font-size: 14px;
              color: #666;
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              color: #666; 
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            @media print {
              body { margin: 0; }
              .position-card { page-break-inside: avoid; }
              .proofread-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Wesleyan University-Philippines</h1>
            <h2>${electionDetails.name}</h2>
          </div>

          <div class="election-details">
            <h3>Election Details</h3>
            <div class="details-grid">
              <div>
                <div class="detail-item">
                  <span><strong>Election Start:</strong></span>
                  <span>${startDateTime.date} ${startDateTime.time}</span>
                </div>
                <div class="detail-item">
                  <span><strong>Election End:</strong></span>
                  <span>${endDateTime.date} ${endDateTime.time}</span>
                </div>
                <div class="detail-item">
                  <span><strong>Status:</strong></span>
                  <span>${electionDetails.status}</span>
                </div>
              </div>
              <div>
                <div class="detail-item">
                  <span><strong>Positions:</strong></span>
                  <span>${electionDetails.positions}</span>
                </div>
                <div class="detail-item">
                  <span><strong>Candidates:</strong></span>
                  <span>${electionDetails.candidates}</span>
                </div>
                <div class="detail-item">
                  <span><strong>Total Voters:</strong></span>
                  <span>${electionDetails.voters}</span>
                </div>
              </div>
              <div>
                <div class="detail-item">
                  <span><strong>Casted Votes:</strong></span>
                  <span style="color: #10b981; font-weight: bold;">${electionDetails.castedVotes}</span>
                </div>
                <div class="detail-item">
                  <span><strong>Uncasted Votes:</strong></span>
                  <span style="color: #f59e0b; font-weight: bold;">${electionDetails.uncastedVotes}</span>
                </div>
                <div class="detail-item">
                  <span><strong>Turnout:</strong></span>
                  <span>${Math.round((electionDetails.castedVotes / electionDetails.voters) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          ${filteredPositions
            .map(
              (position) => `
            <div class="position-card">
              <div class="position-header">
                ${position.name} (${position.totalVotes} total votes)
              </div>
              ${
                position.candidates.length === 0
                  ? '<div class="candidate">No candidates for this position</div>'
                  : position.candidates
                      .map((candidate, index) => {
                        const percentage = calculatePercentage(
                          candidate.votes,
                          position.totalVotes
                        );
                        const isWinner = index === 0 && candidate.votes > 0;

                        return `
                    <div class="candidate ${isWinner ? "winner" : ""}">
                      <div class="candidate-info">
                        <div class="candidate-name">
                          ${candidate.name}
                          ${isWinner ? '<span class="winner-badge">WINNER</span>' : ""}
                        </div>
                        <div class="candidate-party">${candidate.partylist}</div>
                      </div>
                      <div class="vote-info">
                        <div class="votes">${candidate.votes}</div>
                        <div class="percentage">${percentage}%</div>
                      </div>
                    </div>
                  `;
                      })
                      .join("")
              }
            </div>
          `
            )
            .join("")}

          <div class="proofread-section">
            <div class="proofread-title">PROOFREAD BY:</div>
            <div class="signature-line"></div>
            <div class="signature-info">
              <strong>${currentUser?.name || "Administrator"}</strong><br>
              Program Coordinator, CCS<br>
              Date: ${new Date().toLocaleDateString()}
            </div>
          </div>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Wesleyan University Philippines - Enhanced Voting System</p>
          </div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);

        toast({
          title: "Success",
          description: "Print dialog opened successfully",
        });
      } else {
        throw new Error("Unable to open print window");
      }
    } catch (error) {
      console.error("Error printing results:", error);
      toast({
        title: "Error",
        description: "Failed to print results",
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
      // Dynamic import to avoid SSR issues
      const XLSX = await import("xlsx");
      const { default: saveAs } = await import("file-saver");

      const startDateTime = formatDateTime(electionDetails.startDate);
      const endDateTime = formatDateTime(electionDetails.endDate);

      // Prepare election summary data
      const summaryData = [
        ["Election Results Summary"],
        [""],
        ["Election Name", electionDetails.name],
        ["Election Start", `${startDateTime.date} ${startDateTime.time}`],
        ["Election End", `${endDateTime.date} ${endDateTime.time}`],
        ["Status", electionDetails.status],
        ["Total Positions", electionDetails.positions.toString()],
        ["Total Candidates", electionDetails.candidates.toString()],
        ["Total Voters", electionDetails.voters.toString()],
        ["Casted Votes", electionDetails.castedVotes.toString()],
        ["Uncasted Votes", electionDetails.uncastedVotes.toString()],
        [
          "Voter Turnout",
          `${Math.round((electionDetails.castedVotes / electionDetails.voters) * 100)}%`,
        ],
        [""],
        ["Generated On", new Date().toLocaleString()],
        [""],
        [""],
      ];

      // Prepare detailed results data
      const resultsData = [
        [
          "Position",
          "Candidate Name",
          "Party/Affiliation",
          "Votes",
          "Percentage",
          "Rank",
          "Winner",
        ],
      ];

      filteredPositions.forEach((position) => {
        if (position.candidates.length === 0) {
          resultsData.push([
            position.name,
            "No candidates",
            "",
            "",
            "",
            "",
            "",
          ]);
        } else {
          position.candidates.forEach((candidate, index) => {
            const percentage = calculatePercentage(
              candidate.votes,
              position.totalVotes
            );
            const isWinner = index === 0 && candidate.votes > 0;

            resultsData.push([
              position.name,
              candidate.name,
              candidate.partylist,
              candidate.votes.toString(),
              `${percentage}%`,
              (index + 1).toString(),
              isWinner ? "YES" : "NO",
            ]);
          });
        }
        // Add empty row between positions
        resultsData.push(["", "", "", "", "", "", ""]);
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create summary worksheet
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths for summary
      summaryWorksheet["!cols"] = [
        { wch: 20 }, // Label column
        { wch: 30 }, // Value column
      ];

      // Create results worksheet
      const resultsWorksheet = XLSX.utils.aoa_to_sheet(resultsData);

      // Set column widths for results
      resultsWorksheet["!cols"] = [
        { wch: 25 }, // Position
        { wch: 30 }, // Candidate Name
        { wch: 25 }, // Party
        { wch: 10 }, // Votes
        { wch: 12 }, // Percentage
        { wch: 8 }, // Rank
        { wch: 10 }, // Winner
      ];

      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(
        workbook,
        summaryWorksheet,
        "Election Summary"
      );
      XLSX.utils.book_append_sheet(
        workbook,
        resultsWorksheet,
        "Detailed Results"
      );

      // Generate file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Save file
      const fileName = `${electionDetails.name.replace(/[^a-z0-9]/gi, "_")}_Results_${new Date().toISOString().split("T")[0]}.xlsx`;
      saveAs(blob, fileName);

      toast({
        title: "Success",
        description: `Results exported successfully as ${fileName}`,
      });
    } catch (error) {
      console.error("Error exporting results:", error);
      toast({
        title: "Error",
        description: "Failed to export results. Please try again.",
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

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-GB"),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  // Calculate vote percentage
  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

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
            variant="outline"
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
          <Button
            variant="default"
            size="sm"
            onClick={handleAnnounceResults}
            disabled={isAnnouncingResults}
          >
            {isAnnouncingResults ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MailIcon className="h-4 w-4 mr-2" />
            )}
            {isAnnouncingResults ? "Sending..." : "Announce Results by Email"}
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

              <div className="space-y-2">
                <Label>Time Period</Label>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Entire Election</SelectItem>
                    <SelectItem value="morning">Morning Hours</SelectItem>
                    <SelectItem value="afternoon">Afternoon Hours</SelectItem>
                    <SelectItem value="evening">Evening Hours</SelectItem>
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
                                      src={candidate.avatar || undefined}
                                    />
                                    <AvatarFallback>
                                      {candidate.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold">
                                        {candidate.name}
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
                                      {candidate.partylist}
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
