"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useElectionAutoStatus } from "@/hooks/use-election-auto-status";
import { RefreshCwIcon, PlayIcon, PauseIcon } from "lucide-react";

interface ElectionStatus {
  id: number;
  name: string;
  currentStatus: string;
  suggestedStatus: string;
  startDate: string;
  endDate: string;
}

export default function TestAutoStatusPage() {
  const [elections, setElections] = useState<ElectionStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Use the automatic status checking hook
  const { manualCheck } = useElectionAutoStatus({
    enabled: true,
    interval: 10000, // Check every 10 seconds for testing
    onStatusUpdate: (updates) => {
      toast({
        title: "Auto Status Update",
        description: `${updates.length} election(s) status updated automatically`,
        variant: "default",
      });
      fetchElectionStatuses();
    },
  });

  const fetchElectionStatuses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/elections/auto-status-update");
      if (response.ok) {
        const data = await response.json();
        setElections(data.electionsNeedingUpdate || []);
      }
    } catch (error) {
      console.error("Error fetching election statuses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch election statuses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerManualUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/elections/auto-status-update", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Manual Update Complete",
          description: data.message,
          variant: "default",
        });
        fetchElectionStatuses();
      }
    } catch (error) {
      console.error("Error triggering manual update:", error);
      toast({
        title: "Error",
        description: "Failed to trigger manual update",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const manualStatusChange = async (electionId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/elections/${electionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Status Changed",
          description: `Election status changed to ${newStatus}`,
          variant: "default",
        });
        fetchElectionStatuses();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change status");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to change status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchElectionStatuses();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500 hover:bg-green-600";
      case "inactive":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "completed":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Auto Status Test Page
          </h1>
          <p className="text-muted-foreground">
            Test automatic election status updates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchElectionStatuses}
            disabled={loading}
            variant="outline"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={triggerManualUpdate} disabled={loading}>
            Trigger Update
          </Button>
          <Button onClick={manualCheck} disabled={loading} variant="secondary">
            Manual Check
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Elections Needing Status Updates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : elections.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No elections need status updates
            </div>
          ) : (
            <div className="space-y-4">
              {elections.map((election) => (
                <div
                  key={election.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{election.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Start: {formatDateTime(election.startDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        End: {formatDateTime(election.endDate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        className={getStatusBadgeClass(election.currentStatus)}
                      >
                        Current: {election.currentStatus}
                      </Badge>
                      <Badge
                        className={getStatusBadgeClass(
                          election.suggestedStatus
                        )}
                      >
                        Suggested: {election.suggestedStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {election.currentStatus === "INACTIVE" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          manualStatusChange(election.id, "ACTIVE")
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {election.currentStatus === "ACTIVE" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          manualStatusChange(election.id, "INACTIVE")
                        }
                        variant="outline"
                      >
                        <PauseIcon className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            • Elections automatically become <strong>ACTIVE</strong> when the
            current time reaches their start date
          </p>
          <p className="text-sm">
            • Elections automatically become <strong>COMPLETED</strong> when the
            current time passes their end date
          </p>
          <p className="text-sm">
            • You can manually <strong>PAUSE</strong> (set to INACTIVE) an
            active election at any time
          </p>
          <p className="text-sm">
            • You can manually <strong>START</strong> (set to ACTIVE) an
            inactive election if it's within the scheduled time period
          </p>
          <p className="text-sm">
            • Status checks happen automatically every 30 seconds on the main
            elections page
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
