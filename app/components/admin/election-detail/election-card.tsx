"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  UsersIcon,
  VoteIcon,
} from "lucide-react";
import { EditElectionForm } from "@/app/components/admin/election-detail/edit-election-form";
import { DeleteConfirmationDialog } from "@/app/components/admin/delete-confirmation-dialog";
import { StatusChangeDialog } from "@/app/components/admin/status-change-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ElectionCardProps {
  election: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    candidates: number;
    voters: number;
    castVotes: number;
    uncastVotes: number;
  };
}

export function ElectionCard({ election }: ElectionCardProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"start" | "pause">("start");

  const handleStatusChange = (action: "start" | "pause") => {
    setStatusAction(action);
    setStatusDialogOpen(true);
  };

  const handleStatusConfirm = () => {
    console.log(
      `${statusAction === "start" ? "Starting" : "Pausing"} election ${
        election.id
      }`
    );
    // Here you would typically send the request to your backend
  };

  const handleDelete = () => {
    console.log(`Deleting election ${election.id}`);
    // Here you would typically send the request to your backend
  };

  const navigateToElectionDetail = () => {
    router.push(`/admin_dashboard/elections/${election.id}`);
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
              <CardTitle>{election.name}</CardTitle>
              <CardDescription>
                {new Date(election.startDate).toLocaleDateString()} -{" "}
                {new Date(election.endDate).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge
              className={
                election.status === "active"
                  ? "bg-green-500 hover:bg-green-600"
                  : election.status === "scheduled"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : election.status === "completed"
                  ? "bg-gray-500 hover:bg-gray-600"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }
            >
              {election.status.charAt(0).toUpperCase() +
                election.status.slice(1)}
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

              {election.status === "active" ? (
                <DropdownMenuItem onClick={() => handleStatusChange("pause")}>
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause Election
                </DropdownMenuItem>
              ) : election.status === "scheduled" ||
                election.status === "draft" ? (
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
        election={election}
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
