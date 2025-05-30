"use client";

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
import { EditIcon, TrashIcon } from "lucide-react";

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

interface Year {
  id: number;
  name: string;
  departmentId: number;
  department: {
    id: number;
    name: string;
  };
}

interface PositionsTableProps {
  positions: Position[];
  isLoading: boolean;
  filteredPositions: Position[];
  years?: Year[];
  onEditClick: (position: Position) => void;
  onDeleteClick: (position: Position) => void;
}

export function PositionsTable({
  positions,
  isLoading,
  filteredPositions,
  years = [],
  onEditClick,
  onDeleteClick,
}: PositionsTableProps) {
  // Sort years by department name and then year name
  const sortedYears = [...years].sort((a, b) => {
    const deptCompare = a.department.name.localeCompare(b.department.name);
    if (deptCompare !== 0) return deptCompare;
    return a.name.localeCompare(b.name);
  });

  // Function to get year info
  const getYearInfo = (position: Position) => {
    // Use the year relation directly from the position
    if (position.year && position.year.department) {
      return `${position.year.department.name} - ${position.year.name}`;
    }
    return "All Levels";
  };

  return (
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
                <TableHead>Year Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
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
                    <TableCell>{getYearInfo(position)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditClick(position)}
                        >
                          <EditIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteClick(position)}
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
  );
}
