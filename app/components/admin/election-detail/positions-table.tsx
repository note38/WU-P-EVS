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
  programId: number | null;
  year: {
    id: number;
    name: string;
    department: {
      id: number;
      name: string;
    };
  } | null;
  program: {
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
    const aDept = a.program?.department?.name || "";
    const bDept = b.program?.department?.name || "";
    const deptCompare = aDept.localeCompare(bDept);
    if (deptCompare !== 0) return deptCompare;
    return a.name.localeCompare(b.name);
  });

  // Function to get scope/restriction info
  const getScopeInfo = (position: Position) => {
    if (position.year) {
      const deptName = position.year.department?.name || "Unassigned";
      return `${deptName} - ${position.year.name}`;
    }
    if (position.program) {
      const deptName = position.program.department?.name || "Unassigned";
      return `${deptName} - ${position.program.name} (All Years)`;
    }
    return "All Levels / Programs";
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
                <TableHead>Winners Count</TableHead>
                <TableHead>Current Candidates</TableHead>
                <TableHead>Scope / Restriction</TableHead>
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
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        position.year
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : position.program
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {getScopeInfo(position)}
                      </span>
                    </TableCell>
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
