"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Sample positions data
const positions = [
  {
    id: 1,
    name: "President",
    maxCandidates: 1,
    candidates: 4,
  },
  {
    id: 2,
    name: "Vice President",
    maxCandidates: 1,
    candidates: 3,
  },
  {
    id: 3,
    name: "Secretary",
    maxCandidates: 1,
    candidates: 2,
  },
  {
    id: 4,
    name: "Treasurer",
    maxCandidates: 1,
    candidates: 2,
  },
];

interface PositionsTabProps {
  electionId: number;
}

export function PositionsTab({ electionId }: PositionsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPosition, setNewPosition] = useState({
    name: "",
    maxCandidates: 1,
  });

  const filteredPositions = positions.filter((position) =>
    position.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPosition = () => {
    console.log("Adding position:", newPosition);
    // Here you would typically send the data to your backend
    setIsAddDialogOpen(false);
    // Reset form
    setNewPosition({
      name: "",
      maxCandidates: 1,
    });
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
                      maxCandidates: Number.parseInt(e.target.value),
                    })
                  }
                />
              </div>
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
              {filteredPositions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.name}</TableCell>
                  <TableCell>{position.maxCandidates}</TableCell>
                  <TableCell>{position.candidates}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <EditIcon className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
