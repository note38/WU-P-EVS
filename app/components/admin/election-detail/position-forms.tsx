"use client";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";

interface Position {
  id: number;
  name: string;
  maxCandidates: number;
  candidates: number;
  yearId: number | null;
}

interface Year {
  id: number;
  name: string;
  departmentId: number;
  department: {
    id: number;
    name: string;
  };
}

interface PositionFormsProps {
  years: Year[];
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  newPosition: {
    name: string;
    maxCandidates: number;
    yearId: number | null;
  };
  setNewPosition: (position: {
    name: string;
    maxCandidates: number;
    yearId: number | null;
  }) => void;
  currentPosition: Position | null;
  setCurrentPosition: (position: Position | null) => void;
  positionToDelete: Position | null;
  setPositionToDelete: (position: Position | null) => void;
  onAddPosition: () => void;
  onUpdatePosition: () => void;
  onDeletePosition: () => void;
  isSubmitting: boolean;
}

export function PositionForms({
  years,
  isAddDialogOpen,
  setIsAddDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  newPosition,
  setNewPosition,
  currentPosition,
  setCurrentPosition,
  positionToDelete,
  setPositionToDelete,
  onAddPosition,
  onUpdatePosition,
  onDeletePosition,
  isSubmitting,
}: PositionFormsProps) {
  // Sort years by department name and then year name
  const sortedYears = [...years].sort((a, b) => {
    const deptCompare = a.department.name.localeCompare(b.department.name);
    if (deptCompare !== 0) return deptCompare;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {/* Add Position Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Position</DialogTitle>
            <DialogDescription>
              Create a new position for candidates to run for in this election.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position-name" className="col-span-4">
                Position Name
              </Label>
              <Input
                id="position-name"
                placeholder="e.g., President"
                className="col-span-4"
                value={newPosition.name}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    name:
                      e.target.value.charAt(0).toUpperCase() +
                      e.target.value.slice(1),
                  })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max-candidates" className="col-span-4">
                Maximum Candidates
              </Label>
              <Input
                id="max-candidates"
                type="number"
                min="1"
                className="col-span-4"
                value={newPosition.maxCandidates}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    maxCandidates: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            {years.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year-select" className="col-span-4">
                  Year Level (Optional)
                </Label>
                <Select
                  value={newPosition.yearId?.toString() || "null"}
                  onValueChange={(value) =>
                    setNewPosition({
                      ...newPosition,
                      yearId: value === "null" ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger className="col-span-4">
                    <SelectValue placeholder="Select a year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">All Levels</SelectItem>
                    {sortedYears.map((year) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {`${year.department.name} - ${year.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={onAddPosition} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Position Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Update this position's details.
            </DialogDescription>
          </DialogHeader>
          {currentPosition && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-position-name" className="col-span-4">
                  Position Name
                </Label>
                <Input
                  id="edit-position-name"
                  className="col-span-4"
                  value={currentPosition.name}
                  onChange={(e) =>
                    setCurrentPosition({
                      ...currentPosition,
                      name:
                        e.target.value.charAt(0).toUpperCase() +
                        e.target.value.slice(1),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-max-candidates" className="col-span-4">
                  Maximum Candidates
                </Label>
                <Input
                  id="edit-max-candidates"
                  type="number"
                  min="1"
                  className="col-span-4"
                  value={currentPosition.maxCandidates}
                  onChange={(e) =>
                    setCurrentPosition({
                      ...currentPosition,
                      maxCandidates: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              {years.length > 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-year-select" className="col-span-4">
                    Year Level (Optional)
                  </Label>
                  <Select
                    value={currentPosition.yearId?.toString() || "null"}
                    onValueChange={(value) =>
                      setCurrentPosition({
                        ...currentPosition,
                        yearId: value === "null" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">All Levels</SelectItem>
                      {sortedYears.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {`${year.department.name} - ${year.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={onUpdatePosition} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the position "
              {positionToDelete?.name}"? This action cannot be undone.
              {positionToDelete?.candidates &&
                positionToDelete.candidates > 0 && (
                  <p className="mt-2 text-red-500 font-semibold">
                    Warning: This position has {positionToDelete.candidates}{" "}
                    candidate(s). Deleting this position will also remove these
                    candidates.
                  </p>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setPositionToDelete(null)}
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeletePosition}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
