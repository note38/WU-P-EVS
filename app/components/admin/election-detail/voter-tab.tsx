"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  UploadIcon,
  PrinterIcon,
  SendIcon,
} from "lucide-react";
import { SearchInput } from "../search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";

// Sample voters data
const voters = [
  {
    id: "V-78945",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    status: "voted",
    votedAt: "2023-06-15 10:23 AM",
    pollingStation: "Polling Station 3",
  },
  {
    id: "V-12385",
    name: "Emily Johnson",
    email: "emily.johnson@example.com",
    status: "voted",
    votedAt: "2023-06-15 09:45 AM",
    pollingStation: "Online",
  },
  {
    id: "V-45672",
    name: "David Wilson",
    email: "david.wilson@example.com",
    status: "voted",
    votedAt: "2023-06-15 08:30 AM",
    pollingStation: "Polling Station 1",
  },
  {
    id: "V-98732",
    name: "Sophia Martinez",
    email: "sophia.martinez@example.com",
    status: "not_voted",
    votedAt: null,
    pollingStation: null,
  },
  {
    id: "V-23456",
    name: "James Taylor",
    email: "james.taylor@example.com",
    status: "voted",
    votedAt: "2023-06-15 11:15 AM",
    pollingStation: "Polling Station 2",
  },
];

interface VotersTabProps {
  electionId: number;
}

export function VotersTab({ electionId }: VotersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVoters, setSelectedVoters] = useState<string[]>([]);
  const [newVoter, setNewVoter] = useState({
    name: "",
    email: "",
    sendCredentials: true,
  });

  const filteredVoters = voters.filter(
    (voter) =>
      voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedVoters.length === filteredVoters.length) {
      setSelectedVoters([]);
    } else {
      setSelectedVoters(filteredVoters.map((voter) => voter.id));
    }
  };

  const toggleSelectVoter = (id: string) => {
    if (selectedVoters.includes(id)) {
      setSelectedVoters(selectedVoters.filter((voterId) => voterId !== id));
    } else {
      setSelectedVoters([...selectedVoters, id]);
    }
  };

  const handleAddVoter = () => {
    console.log("Adding voter:", newVoter);
    // Here you would typically send the data to your backend
    setIsAddDialogOpen(false);
    // Reset form
    setNewVoter({
      name: "",
      email: "",
      sendCredentials: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Election Voters</h2>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <UploadIcon className="h-4 w-4 mr-2" />
            Import Voters
          </Button>
          <Button variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print Voters
          </Button>
          <Button variant="outline" size="sm">
            <SendIcon className="h-4 w-4 mr-2" />
            Send Credentials
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Voter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Voter</DialogTitle>
                <DialogDescription>
                  Add a new voter to this election.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="voter-name" className="col-span-4">
                    Voter Name
                  </Label>
                  <Input
                    id="voter-name"
                    placeholder="Full name"
                    className="col-span-4"
                    value={newVoter.name}
                    onChange={(e) =>
                      setNewVoter({ ...newVoter, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="voter-email" className="col-span-4">
                    Email
                  </Label>
                  <Input
                    id="voter-email"
                    type="email"
                    placeholder="Email address"
                    className="col-span-4"
                    value={newVoter.email}
                    onChange={(e) =>
                      setNewVoter({ ...newVoter, email: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-credentials"
                    checked={newVoter.sendCredentials}
                    onCheckedChange={(checked) =>
                      setNewVoter({
                        ...newVoter,
                        sendCredentials: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="send-credentials">
                    Send login credentials via email
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddVoter}>Add Voter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <SearchInput
          placeholder="Search voters by name, email, or ID..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="max-w-md"
        />

        {selectedVoters.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {selectedVoters.length} selected
            </span>
            <Button variant="outline" size="sm">
              <SendIcon className="h-4 w-4 mr-2" />
              Email Selected
            </Button>
            <Button variant="outline" size="sm">
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print Selected
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedVoters.length === filteredVoters.length &&
                      filteredVoters.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Voted At</TableHead>
                <TableHead>Polling Station</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVoters.map((voter) => (
                <TableRow key={voter.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedVoters.includes(voter.id)}
                      onCheckedChange={() => toggleSelectVoter(voter.id)}
                      aria-label={`Select ${voter.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{voter.id}</TableCell>
                  <TableCell>{voter.name}</TableCell>
                  <TableCell>{voter.email}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        voter.status === "voted"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      }
                    >
                      {voter.status === "voted" ? "Voted" : "Not Voted"}
                    </Badge>
                  </TableCell>
                  <TableCell>{voter.votedAt || "N/A"}</TableCell>
                  <TableCell>{voter.pollingStation || "N/A"}</TableCell>
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
