import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { EditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { EditCandidateDialog } from "./edit-candidate-dialog";

interface Candidate {
  id: number;
  name: string;
  position: string;
  positionId: number;
  party: string;
  partylistId: number;
  votes: number;
  avatar: string;
  year?: {
    id: number;
    name: string;
    department?: {
      id: number;
      name: string;
    };
  };
}

interface CandidatesTableProps {
  candidates: Candidate[];
  loading?: boolean;
  onCandidateUpdated?: () => void;
  electionId: number;
  positions: any[];
  partylists: any[];
}

export function CandidatesTable({
  candidates,
  loading = false,
  onCandidateUpdated,
  electionId,
  positions,
  partylists,
}: CandidatesTableProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(
    null
  );
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(
    null
  );

  // Remove client-side filtering since we now do server-side search
  const displayCandidates = candidates;

  const handleDeleteClick = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = (candidate: Candidate) => {
    setCandidateToEdit(candidate);
    setIsEditDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!candidateToDelete) return;

    try {
      const response = await fetch(
        `/api/elections/${electionId}/candidates/${candidateToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Candidate deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setCandidateToDelete(null);
        onCandidateUpdated?.();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete candidate",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setCandidateToEdit(null);
    onCandidateUpdated?.();
  };

  return (
    <>
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Department/Year</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Loading candidates...
                  </TableCell>
                </TableRow>
              ) : displayCandidates.length > 0 ? (
                displayCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              candidate.avatar ||
                              "/placeholder.svg?height=40&width=40"
                            }
                            alt={candidate.name}
                          />
                          <AvatarFallback>
                            {candidate.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>{candidate.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.position}</TableCell>
                    <TableCell>{candidate.party}</TableCell>
                    <TableCell>
                      {candidate.year && (
                        <>
                          <Badge variant="outline" className="mr-1">
                            {candidate.year.department?.name || "N/A"}
                          </Badge>
                          <Badge variant="secondary">
                            {candidate.year.name}
                          </Badge>
                        </>
                      )}
                    </TableCell>
                    <TableCell>{candidate.votes.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(candidate)}
                        >
                          <EditIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(candidate)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No candidates found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditCandidateDialog
        candidate={candidateToEdit}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
        electionId={electionId}
        positions={positions}
        partylists={partylists}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{candidateToDelete?.name}</strong>? This action cannot be
              undone and will permanently remove the candidate from the
              election.
              {candidateToDelete?.votes && candidateToDelete.votes > 0 && (
                <p className="mt-2 text-red-500 font-semibold">
                  Warning: This candidate has {candidateToDelete.votes} vote(s).
                  Deleting will also remove these votes.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCandidateToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Candidate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
