"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react";
import { SearchInput } from "../search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

// Sample candidates data
const candidates = [
  {
    id: 1,
    name: "Jane Smith",
    position: "President",
    party: "Progressive Party",
    status: "approved",
    votes: 1245,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    name: "John Doe",
    position: "President",
    party: "Conservative Party",
    status: "approved",
    votes: 1120,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    name: "Alex Johnson",
    position: "Vice President",
    party: "Progressive Party",
    status: "approved",
    votes: 980,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    name: "Sarah Williams",
    position: "Vice President",
    party: "Conservative Party",
    status: "approved",
    votes: 850,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 5,
    name: "Michael Brown",
    position: "Secretary",
    party: "Independent",
    status: "pending",
    votes: 0,
    avatar: "/placeholder.svg?height=40&width=40",
  },
];

// Sample positions for the dropdown
const positions = [
  { id: 1, name: "President" },
  { id: 2, name: "Vice President" },
  { id: 3, name: "Secretary" },
  { id: 4, name: "Treasurer" },
];

interface CandidatesTabProps {
  electionId: number;
}

export function CandidatesTab({ electionId }: CandidatesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    position: "",
    party: "",
  });

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.party.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCandidate = () => {
    console.log("Adding candidate:", newCandidate);
    // Here you would typically send the data to your backend
    setIsAddDialogOpen(false);
    // Reset form
    setNewCandidate({
      name: "",
      position: "",
      party: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Election Candidates</h2>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Candidate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
              <DialogDescription>
                Add a new candidate to run for a position in this election.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="candidate-name" className="col-span-4">
                  Candidate Name
                </Label>
                <Input
                  id="candidate-name"
                  placeholder="Full name"
                  className="col-span-4"
                  value={newCandidate.name}
                  onChange={(e) =>
                    setNewCandidate({ ...newCandidate, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="candidate-position" className="col-span-4">
                  Position
                </Label>
                <Select
                  onValueChange={(value) =>
                    setNewCandidate({ ...newCandidate, position: value })
                  }
                  value={newCandidate.position}
                >
                  <SelectTrigger id="candidate-position" className="col-span-4">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position.id} value={position.name}>
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="candidate-party" className="col-span-4">
                  Party/Affiliation
                </Label>
                <Input
                  id="candidate-party"
                  placeholder="Party or affiliation"
                  className="col-span-4"
                  value={newCandidate.party}
                  onChange={(e) =>
                    setNewCandidate({ ...newCandidate, party: e.target.value })
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
              <Button onClick={handleAddCandidate}>Add Candidate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <SearchInput
        placeholder="Search candidates by name, position, or party..."
        value={searchTerm}
        onChange={setSearchTerm}
        className="max-w-md"
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={candidate.avatar}
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
                    <Badge
                      className={
                        candidate.status === "approved"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-yellow-500 hover:bg-yellow-600"
                      }
                    >
                      {candidate.status.charAt(0).toUpperCase() +
                        candidate.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{candidate.votes.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <EyeIcon className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
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
