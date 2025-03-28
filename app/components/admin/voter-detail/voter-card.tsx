"use client";

import { useState } from "react";
import { VoterStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  EditIcon,
  TrashIcon,
  EyeIcon,
  PrinterIcon,
  SendIcon,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

interface Voter {
  id: number;
  voterId: string;
  name: string;
  email: string;
  status: VoterStatus;
  createdAt: Date;
  election: {
    name: string;
  };
  department: {
    name: string;
  };
}

export default function VoterList({ voters }: { voters: Voter[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);

  // Filter voters based on search term
  const filteredVoters = voters.filter(
    (voter) =>
      voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.voterId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle selection of a single voter
  const toggleVoterSelection = (voterId: number) => {
    setSelectedVoters((prev) =>
      prev.includes(voterId)
        ? prev.filter((id) => id !== voterId)
        : [...prev, voterId]
    );
  };

  // Toggle select all voters
  const toggleSelectAll = () => {
    setSelectedVoters(
      selectedVoters.length === filteredVoters.length
        ? []
        : filteredVoters.map((voter) => voter.id)
    );
  };

  // Placeholder for bulk email handler
  const handleBulkEmail = () => {
    // Implement bulk email functionality
    console.log("Sending emails to:", selectedVoters);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <Input
          placeholder="Search voters (name, email, voter ID)..."
          className="w-full sm:max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {selectedVoters.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-muted-foreground">
              {selectedVoters.length} selected
            </span>
            <Button variant="outline" size="sm" onClick={handleBulkEmail}>
              <SendIcon className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" size="sm">
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Checkbox
          checked={
            selectedVoters.length === filteredVoters.length &&
            filteredVoters.length > 0
          }
          onCheckedChange={toggleSelectAll}
          id="select-all"
        />
        <label htmlFor="select-all" className="text-sm font-medium">
          Select All
        </label>
      </div>

      {filteredVoters.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No voters found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoters.map((voter) => (
            <Card key={voter.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedVoters.includes(voter.id)}
                    onCheckedChange={() => toggleVoterSelection(voter.id)}
                  />
                  <Avatar>
                    <AvatarFallback>
                      {voter.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{voter.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {voter.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Voter ID: {voter.voterId}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <EyeIcon className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col space-y-2 mt-2">
                  <div className="flex justify-between items-center">
                    <Badge
                      variant={
                        voter.status === VoterStatus.REGISTERED
                          ? "outline"
                          : "default"
                      }
                    >
                      {voter.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Registered: {voter.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Election:</span>{" "}
                    {voter.election.name}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Department:</span>{" "}
                    {voter.department.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
