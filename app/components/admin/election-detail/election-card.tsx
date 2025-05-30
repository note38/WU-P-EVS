"use client";

import { DeleteConfirmationDialog } from "@/app/components/admin/delete-confirmation-dialog";
import { EditElectionForm } from "@/app/components/admin/election-detail/edit-election-form";
import { StatusChangeDialog } from "@/app/components/admin/status-change-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useElectionAutoStatus } from "@/hooks/use-election-auto-status";
import {
  EditIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  UsersIcon,
  VoteIcon,
  ClockIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ElectionCardProps {
  election: {
    id: number;
    name: string;
    description?: string;
    status: string;
    candidates: number;
    voters: number;
    castVotes: number;
    uncastVotes: number;
    fullStartDate: string;
    fullEndDate: string;
    partyList?: string[];
  };
}

export function ElectionCard({ election }: ElectionCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"start" | "pause">("start");
  const [currentElectionStatus, setCurrentElectionStatus] = useState(
    election.status
  );

  // Use the automatic status checking hook
  useElectionAutoStatus({
    enabled: true,
    interval: 30000, // Check every 30 seconds
    onStatusUpdate: (updates) => {
      // Update local status if this election was updated
      const thisElectionUpdate = updates.find(
        (update) => update.id === election.id
      );
      if (thisElectionUpdate) {
        setCurrentElectionStatus(
          thisElectionUpdate.suggestedStatus.toLowerCase()
        );
      }
    },
  });

  // Update local status when election prop changes
  useEffect(() => {
    setCurrentElectionStatus(election.status);
  }, [election.status]);

  // Format date and time for display
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const startDateTime = formatDateTime(election.fullStartDate);
  const endDateTime = formatDateTime(election.fullEndDate);

  // Check if election should be automatically active or completed
  const getExpectedStatus = () => {
    const now = new Date();
    const startDate = new Date(election.fullStartDate);
    const endDate = new Date(election.fullEndDate);

    if (now >= endDate) {
      return "completed";
    } else if (now >= startDate && now < endDate) {
      return "active";
    } else {
      return "inactive";
    }
  };

  const expectedStatus = getExpectedStatus();
  const isStatusOutOfSync = currentElectionStatus !== expectedStatus;

  const handleStatusChange = (action: "start" | "pause") => {
    const now = new Date();
    const endDate = new Date(election.fullEndDate);

    // Prevent starting an election that has already ended
    if (action === "start" && now >= endDate) {
      toast({
        title: "Cannot Start Election",
        description: "This election has already ended and cannot be started.",
        variant: "destructive",
      });
      return;
    }

    setStatusAction(action);
    setStatusDialogOpen(true);
  };

  const handleStatusConfirm = async () => {
    try {
      const newStatus = statusAction === "start" ? "ACTIVE" : "INACTIVE";

      const response = await fetch(`/api/elections/${election.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData === "object" && errorData.error) {
            // Format the error message to be more user-friendly
            if (
              errorData.error.includes(
                "Cannot start an election before its scheduled start time"
              )
            ) {
              const startDateTime = formatDateTime(election.fullStartDate);
              errorMessage = `This election is scheduled to start on ${startDateTime.date} at ${startDateTime.time}. Please try again at the scheduled time.`;
            } else {
              errorMessage = errorData.error;
            }
          }
        } catch (e) {
          console.error("Error parsing response JSON:", e);
        }

        // Instead of throwing the error, show the toast and return
        toast({
          title:
            statusAction === "start"
              ? "Cannot Start Election"
              : "Cannot Pause Election",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Update local status
      setCurrentElectionStatus(newStatus.toLowerCase());

      toast({
        title: "Success",
        description: `Election has been ${statusAction === "start" ? "started" : "paused"} successfully`,
        variant: "default",
      });

      // Refresh the page to show the updated status
      router.refresh();
    } catch (error) {
      console.error(`Error ${statusAction}ing election:`, error);

      toast({
        title:
          statusAction === "start"
            ? "Cannot Start Election"
            : "Cannot Pause Election",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${statusAction} election`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/elections/${election.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (e) {
          console.error("Error parsing JSON response:", e);
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error || `Failed to delete election (${response.status})`
        );
      }

      toast({
        title: "Success",
        description: data?.message || "Election has been deleted successfully",
        variant: "default",
      });

      // Refresh the page to show the updated list
      router.refresh();
    } catch (error) {
      console.error("Error deleting election:", error);

      toast({
        title: "Delete Error",
        description:
          error instanceof Error ? error.message : "Failed to delete election",
        variant: "destructive",
      });
    } finally {
      // Close the delete confirmation dialog
      setDeleteDialogOpen(false);
    }
  };

  const navigateToElectionDetail = () => {
    router.push(`/admin_dashboard/elections/${election.id}`);
  };

  // Get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
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

  return (
    <>
      <Card
        className="h-full transition-all hover:shadow-md cursor-pointer"
        onClick={navigateToElectionDetail}
      >
        <CardHeader>
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                {election.name}
                {isStatusOutOfSync && (
                  <ClockIcon className="h-4 w-4 text-orange-500" />
                )}
              </CardTitle>
              <CardDescription>
                <div>
                  Start: {startDateTime.date} {startDateTime.time}
                </div>
                <div>
                  End: {endDateTime.date} {endDateTime.time}
                </div>
                {isStatusOutOfSync && (
                  <div className="text-orange-600 text-xs mt-1">
                    Expected:{" "}
                    {expectedStatus.charAt(0).toUpperCase() +
                      expectedStatus.slice(1)}
                  </div>
                )}
              </CardDescription>
            </div>
            <Badge className={getStatusBadgeClass(currentElectionStatus)}>
              {currentElectionStatus.charAt(0).toUpperCase() +
                currentElectionStatus.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <VoteIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm">{election.candidates} Candidates</span>
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm">{election.voters} Voters</span>
            </div>
            <div className="col-span-2 mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Cast Votes: {election.castVotes}</span>
                <span>Uncast Votes: {election.uncastVotes}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{
                    width: `${(election.castVotes / election.voters) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
            onClick={(e) => {
              e.stopPropagation();
              navigateToElectionDetail();
            }}
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Details
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Election
              </DropdownMenuItem>

              {currentElectionStatus === "active" ? (
                <DropdownMenuItem onClick={() => handleStatusChange("pause")}>
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause Election
                </DropdownMenuItem>
              ) : currentElectionStatus === "inactive" ? (
                <DropdownMenuItem onClick={() => handleStatusChange("start")}>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Election
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Election
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <EditElectionForm
        election={{
          id: election.id,
          name: election.name,
          description: election.description,
          startDate: election.fullStartDate,
          endDate: election.fullEndDate,
          partyList: election.partyList || [],
        }}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <DeleteConfirmationDialog
        electionName={election.name}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />

      <StatusChangeDialog
        electionName={election.name}
        action={statusAction}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
}
