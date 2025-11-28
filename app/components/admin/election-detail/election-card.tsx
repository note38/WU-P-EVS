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
import { useState, useEffect, useCallback } from "react";

// Dialog cleanup utility to prevent UI freeze
const cleanupDialogState = () => {
  // Force cleanup of any modal state
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  document.body.classList.remove("overflow-hidden");

  // Remove any stuck modal attributes
  document.body.removeAttribute("data-scroll-locked");
  document.documentElement.removeAttribute("data-scroll-locked");

  // Re-enable interactions
  const allElements = document.querySelectorAll("*");
  allElements.forEach((el) => {
    const element = el as HTMLElement;
    if (element.style.pointerEvents === "none") {
      element.style.pointerEvents = "";
    }
  });
};

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
  onElectionUpdated?: () => void; // Add callback prop for data refresh
}

export function ElectionCard({
  election,
  onElectionUpdated,
}: ElectionCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"start" | "pause">("start");
  const [currentElectionStatus, setCurrentElectionStatus] = useState(
    election.status
  );

  // Enhanced dialog state management with cleanup
  const handleEditDialogChange = useCallback((open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      // Cleanup when dialog closes
      setTimeout(cleanupDialogState, 100);
    }
  }, []);

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setTimeout(cleanupDialogState, 100);
    }
  }, []);

  const handleStatusDialogChange = useCallback((open: boolean) => {
    setStatusDialogOpen(open);
    if (!open) {
      setTimeout(cleanupDialogState, 100);
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupDialogState();
    };
  }, []);

  // Update local status when election prop changes
  useEffect(() => {
    setCurrentElectionStatus(election.status);
  }, [election.status]);

  // Format date and time for display
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
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
    handleStatusDialogChange(true);
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

      // Trigger data refresh if callback is provided
      if (onElectionUpdated) {
        onElectionUpdated();
      }
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

      // Trigger data refresh if callback is provided
      if (onElectionUpdated) {
        onElectionUpdated();
      }
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
    if (currentElectionStatus === "active") {
      toast({
        title: "Access Restricted",
        description:
          "Cannot view election details while the election is active",
        variant: "destructive",
      });
      return;
    }
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
        className={`h-full transition-all hover:shadow-md ${currentElectionStatus !== "active" ? "cursor-pointer" : "cursor-not-allowed"}`}
        onClick={(e) => {
          e.stopPropagation();
          if (currentElectionStatus !== "active") {
            navigateToElectionDetail();
          } else {
            toast({
              title: "Access Restricted",
              description:
                "Cannot view election details while the election is active",
              variant: "destructive",
            });
          }
        }}
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
              if (currentElectionStatus === "active") {
                toast({
                  title: "Access Restricted",
                  description:
                    "Cannot view election details while the election is active",
                  variant: "destructive",
                });
                return;
              }
              navigateToElectionDetail();
            }}
            disabled={currentElectionStatus === "active"}
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
                disabled={currentElectionStatus === "active"}
              >
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={() => {
                  if (currentElectionStatus === "active") {
                    toast({
                      title: "Action Restricted",
                      description: "Cannot edit election while it is active",
                      variant: "destructive",
                    });
                    return;
                  }
                  handleEditDialogChange(true);
                }}
                disabled={currentElectionStatus === "active"}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Election
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  if (currentElectionStatus === "active") {
                    toast({
                      title: "Action Restricted",
                      description: "Cannot delete election while it is active",
                      variant: "destructive",
                    });
                    return;
                  }
                  handleDeleteDialogChange(true);
                }}
                disabled={currentElectionStatus === "active"}
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
        onOpenChange={handleEditDialogChange}
        onElectionUpdated={onElectionUpdated}
      />

      <DeleteConfirmationDialog
        electionName={election.name}
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onConfirm={handleDelete}
      />

      <StatusChangeDialog
        electionName={election.name}
        action={statusAction}
        open={statusDialogOpen}
        onOpenChange={handleStatusDialogChange}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
}
