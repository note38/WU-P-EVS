"use client";

import { SearchInput } from "@/app/components/admin/search-input";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { PositionForms } from "./position-forms";
import { PositionsTable } from "./positions-table";

// Define position type
interface Position {
  id: number;
  name: string;
  maxCandidates: number;
  candidates: number;
  yearId: number | null;
  year: {
    id: number;
    name: string;
    department: {
      id: number;
      name: string;
    };
  } | null;
}

// Define year type
interface Year {
  id: number;
  name: string;
  departmentId: number;
  department: {
    id: number;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (isSubmitting) return; // Prevent multiple submissions

    if (!newPosition.name.trim()) {
      toast({
        title: "Error",
        description: "Position name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (position: Position) => {
    const positionWithYear = {
      ...position,
      year: position.year || null,
    };
    setCurrentPosition(positionWithYear);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (position: Position) => {
    const positionWithYear = {
      ...position,
      year: position.year || null,
    };
    setPositionToDelete(positionWithYear);
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

        <PositionForms
          years={years}
          isAddDialogOpen={isAddDialogOpen}
          setIsAddDialogOpen={setIsAddDialogOpen}
          isEditDialogOpen={isEditDialogOpen}
          setIsEditDialogOpen={setIsEditDialogOpen}
          isDeleteDialogOpen={isDeleteDialogOpen}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          newPosition={newPosition}
          setNewPosition={setNewPosition}
          currentPosition={currentPosition as any}
          setCurrentPosition={setCurrentPosition as any}
          positionToDelete={positionToDelete as any}
          setPositionToDelete={setPositionToDelete as any}
          onAddPosition={handleAddPosition}
          onUpdatePosition={handleUpdatePosition}
          onDeletePosition={handleDeletePosition}
          isSubmitting={isSubmitting}
        />
      </div>

      <SearchInput
        placeholder="Search positions..."
        value={searchTerm}
        onChange={setSearchTerm}
        className="max-w-md"
      />

      <PositionsTable
        positions={positions}
        isLoading={isLoading}
        filteredPositions={filteredPositions}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
      />
    </div>
  );
}
