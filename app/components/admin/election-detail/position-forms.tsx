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
  programId: number | null;
}

interface Year {
  id: number;
  name: string;
  programId: number | null;
  program?: {
    id: number;
    name: string;
    departmentId: number;
    department: {
      id: number;
      name: string;
    };
  } | null;
}

interface Program {
  id: number;
  name: string;
  departmentId: number;
  department?: {
    id: number;
    name: string;
  } | null;
}

interface PositionFormsProps {
  years: Year[];
  programs: Program[];
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
    programId: number | null;
  };
  setNewPosition: (position: {
    name: string;
    maxCandidates: number;
    yearId: number | null;
    programId: number | null;
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
  programs,
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
  // Sort years by department name, then program name, and then year name
  const sortedYears = [...years].sort((a, b) => {
    const aDept = a.program?.department?.name || "";
    const bDept = b.program?.department?.name || "";
    const deptCompare = aDept.localeCompare(bDept);
    if (deptCompare !== 0) return deptCompare;
    
    const aProg = a.program?.name || "";
    const bProg = b.program?.name || "";
    const progCompare = aProg.localeCompare(bProg);
    if (progCompare !== 0) return progCompare;
    
    return a.name.localeCompare(b.name);
  });

  // Sort programs by department name and then program name
  const sortedPrograms = [...programs].sort((a, b) => {
    const aDept = a.department?.name || "";
    const bDept = b.department?.name || "";
    const deptCompare = aDept.localeCompare(bDept);
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
            
            {programs.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="program-select" className="col-span-4">
                  Program Restriction (Optional)
                </Label>
                <Select
                  value={newPosition.programId?.toString() || "null"}
                  onValueChange={(value) => {
                    const programId = value === "null" ? null : parseInt(value);
                    setNewPosition({
                      ...newPosition,
                      programId,
                      yearId: null, // Reset year restriction when program changes
                    });
                  }}
                >
                  <SelectTrigger className="col-span-4">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">All Programs</SelectItem>
                    {sortedPrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.department ? `${program.department.name} - ${program.name}` : program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {years.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year-select" className="col-span-4">
                  Year Level Restriction (Optional)
                </Label>
                <Select
                  value={newPosition.yearId?.toString() || "null"}
                  onValueChange={(value) => {
                    const yearId = value === "null" ? null : parseInt(value);
                    if (yearId !== null) {
                      setNewPosition({
                        ...newPosition,
                        yearId,
                        programId: null, // Keep programId null to prioritize yearLevel
                      });
                    } else {
                      setNewPosition({
                        ...newPosition,
                        yearId: null,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="col-span-4">
                    <SelectValue placeholder="Select a year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">All Year Levels</SelectItem>
                    {sortedYears
                      .filter((year) => !newPosition.programId || year.programId === newPosition.programId)
                      .map((year) => {
                        const deptName = year.program?.department?.name || "Unassigned";
                        const progName = year.program?.name || "";
                        return (
                          <SelectItem key={year.id} value={year.id.toString()}>
                            {`${deptName} - ${progName} ${year.name}`}
                          </SelectItem>
                        );
                      })}
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
              
              {programs.length > 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-program-select" className="col-span-4">
                    Program Restriction (Optional)
                  </Label>
                  <Select
                    value={currentPosition.programId?.toString() || "null"}
                    onValueChange={(value) => {
                      const programId = value === "null" ? null : parseInt(value);
                      setCurrentPosition({
                        ...currentPosition,
                        programId,
                        yearId: null, // Reset year restriction when program changes
                      });
                    }}
                  >
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">All Programs</SelectItem>
                      {sortedPrograms.map((program) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.department ? `${program.department.name} - ${program.name}` : program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {years.length > 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-year-select" className="col-span-4">
                    Year Level Restriction (Optional)
                  </Label>
                  <Select
                    value={currentPosition.yearId?.toString() || "null"}
                    onValueChange={(value) => {
                      const yearId = value === "null" ? null : parseInt(value);
                      if (yearId !== null) {
                        setCurrentPosition({
                          ...currentPosition,
                          yearId,
                          programId: null, // Keep programId null to prioritize yearLevel
                        });
                      } else {
                        setCurrentPosition({
                          ...currentPosition,
                          yearId: null,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">All Year Levels</SelectItem>
                      {sortedYears
                        .filter((year) => !currentPosition.programId || year.programId === currentPosition.programId)
                        .map((year) => {
                          const deptName = year.program?.department?.name || "Unassigned";
                          const progName = year.program?.name || "";
                          return (
                            <SelectItem key={year.id} value={year.id.toString()}>
                              {`${deptName} - ${progName} ${year.name}`}
                            </SelectItem>
                          );
                        })}
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
