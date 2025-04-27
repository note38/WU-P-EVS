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
import { Checkbox } from "@/components/ui/checkbox";
import { CreateVoterForm } from "../voter-detail/create-voter-form"; // Import the CreateVoterForm component

// Sample voters data
const voters = [
  {
    id: "V-78945",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    status: "voted",
    votedAt: "2023-06-15 10:23 AM",
  },
  {
    id: "V-12385",
    name: "Emily Johnson",
    email: "emily.johnson@example.com",
    status: "voted",
    votedAt: "2023-06-15 09:45 AM",
  },
  {
    id: "V-45672",
    name: "David Wilson",
    email: "david.wilson@example.com",
    status: "voted",
    votedAt: "2023-06-15 08:30 AM",
  },
  {
    id: "V-98732",
    name: "Sophia Martinez",
    email: "sophia.martinez@example.com",
    status: "not_voted",
    votedAt: null,
  },
  {
    id: "V-23456",
    name: "James Taylor",
    email: "james.taylor@example.com",
    status: "voted",
    votedAt: "2023-06-15 11:15 AM",
  },
];

interface VotersTabProps {
  electionId: number;
}

export function VotersTab({ electionId }: VotersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<string[]>([]);

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

          {/* Use the imported CreateVoterForm component */}
          <CreateVoterForm />
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
