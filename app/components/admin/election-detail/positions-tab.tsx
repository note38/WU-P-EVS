"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { SearchInput } from "@/app/components/admin/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define position type
interface Position {
  id: number;
  name: string;
  maxCandidates: number;
  candidates: number;
  yearId: number | null;
}

// Define year type
interface Year {
  id: number;
  name: string;
  departmentId: number;
  department?: {
    name: string;
  };
}

interface PositionsTabProps {
  electionId: number;
}

export function PositionsTab({ electionId }: PositionsTabProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingYears, setIsLoadingYears] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(
    null
  );
  const [newPosition, setNewPosition] = useState({
    name: "",
    maxCandidates: 1,
    yearId: null as number | null,
  });
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);

  // Fetch positions from API
  useEffect(() => {
    fetchPositions();
  }, [electionId]);

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/elections/${electionId}/positions`);

      if (!response.ok) {
        throw new Error("Failed to fetch positions");
      }

      const data = await response.json();
      setPositions(data);
    } catch (error) {
      console.error("Error fetching positions:", error);
      toast({
        title: "Error",
        description: "Failed to load positions. Please try again later.",
        variant: "destructive",
      });
      // Set empty positions array on error
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Fetch years for the year selector dropdown
  const fetchYears = async () => {
    setIsLoadingYears(true);
    try {
      const response = await fetch("/api/years");

      if (!response.ok) {
        throw new Error("Failed to fetch years");
      }

      const data = await response.json();
      setYears(data);
    } catch (error) {
      console.error("Error fetching years:", error);
      // Set empty years array on error
      setYears([]);
    } finally {
      setIsLoadingYears(false);
    }
  };

  // Call fetchYears when component mounts
  useEffect(() => {
    fetchYears();
  }, []);

  const filteredPositions = positions.filter((position) =>
    position.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPosition = async () => {
    if (!newPosition.name.trim()) {
      toast({
        title: "Error",
        description: "Position name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/elections/${electionId}/positions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPosition),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add position");
      }

      // Refresh positions from the server to ensure we have the latest data
      await fetchPositions();

      toast({
        title: "Success",
        description: `Position "${newPosition.name}" has been added`,
      });

      // Close the dialog and reset form
      setIsAddDialogOpen(false);
      setNewPosition({
        name: "",
        maxCandidates: 1,
        yearId: null,
      });
    } catch (error) {
      console.error("Error adding position:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add position. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (position: Position) => {
    setCurrentPosition(position);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (position: Position) => {
    setPositionToDelete(position);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdatePosition = async () => {
    if (!currentPosition) return;

    try {
      const response = await fetch(
        `/api/elections/${electionId}/positions/${currentPosition.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: currentPosition.name,
            maxCandidates: currentPosition.maxCandidates,
            yearId: currentPosition.yearId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update position");
      }

      // Refresh positions from the server
      await fetchPositions();

      toast({
        title: "Success",
        description: `Position "${currentPosition.name}" has been updated`,
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating position:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update position. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePosition = async () => {
    if (!positionToDelete) return;

    try {
      const response = await fetch(
        `/api/elections/${electionId}/positions/${positionToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete position");
      }

      // Refresh positions from the server
      await fetchPositions();

      toast({
        title: "Success",
        description: `Position "${positionToDelete.name}" has been removed`,
      });

      // Close the delete dialog
      setIsDeleteDialogOpen(false);
      setPositionToDelete(null);
    } catch (error) {
      console.error("Error deleting position:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete position. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Election Positions</h2>

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
                Create a new position for candidates to run for in this
                election.
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
                    setNewPosition({ ...newPosition, name: e.target.value })
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
                      <SelectItem value="null">None</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name}{" "}
                          {year.department && `(${year.department.name})`}
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
              >
                Cancel
              </Button>
              <Button onClick={handleAddPosition}>Add Position</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <SearchInput
        placeholder="Search positions..."
        value={searchTerm}
        onChange={setSearchTerm}
        className="max-w-md"
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <p>Loading positions...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Max Candidates</TableHead>
                  <TableHead>Current Candidates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No positions found. Create your first position by clicking
                      "Add Position".
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPositions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">
                        {position.name}
                      </TableCell>
                      <TableCell>{position.maxCandidates}</TableCell>
                      <TableCell>{position.candidates}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(position)}
                          >
                            <EditIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(position)}
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                      name: e.target.value,
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
                      <SelectItem value="null">None</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name}{" "}
                          {year.department && `(${year.department.name})`}
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
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePosition}>Update Position</Button>
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
            <AlertDialogCancel onClick={() => setPositionToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePosition}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
