"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// Define VoterStatus enum since we don't have @prisma/client
enum VoterStatus {
  REGISTERED = "REGISTERED",
  VOTED = "VOTED",
  DISQUALIFIED = "DISQUALIFIED",
}

type Voter = {
  id: number;
  voterId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  status: VoterStatus;
  avatar: string;
  credentialsSent: boolean;
  createdAt: Date;
  election: {
    name: string;
  };
  department: {
    name: string;
  };
  info?: any;
};

interface VoterCardsProps {
  voters: Voter[];
  info?: any | null;
}

export default function VoterCards({ voters, info }: VoterCardsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);

  const getFullName = (voter: Voter) => {
    return `${voter.firstName} ${voter.middleName} ${voter.lastName}`
      .trim()
      .replace(/\s+/g, " ");
  };

  const filteredVoters = voters.filter((voter) => {
    const fullName = getFullName(voter);
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.toLowerCase().includes(searchLower) ||
      voter.email.toLowerCase().includes(searchLower) ||
      voter.voterId.toLowerCase().includes(searchLower)
    );
  });

  const toggleVoterSelection = (voterId: number) => {
    setSelectedVoters((prev) =>
      prev.includes(voterId)
        ? prev.filter((id) => id !== voterId)
        : [...prev, voterId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedVoters(
      selectedVoters.length === filteredVoters.length
        ? []
        : filteredVoters.map((voter) => voter.id)
    );
  };

  const handleBulkEmail = () => {
    console.log("Sending emails to:", selectedVoters);
    // Implement actual email logic
  };

  return (
    <div className="space-y-4">
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
          Select All ({filteredVoters.length} voters)
        </label>
      </div>

      {filteredVoters.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No voters found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoters.map((voter) => {
            const fullName = getFullName(voter);
            return (
              <Card key={voter.id} className="overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedVoters.includes(voter.id)}
                      onCheckedChange={() => toggleVoterSelection(voter.id)}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={voter.avatar || "/placeholder.svg"}
                        alt={fullName}
                      />
                      <AvatarFallback>
                        {fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="font-medium line-clamp-1">{fullName}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {voter.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {voter.voterId}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />

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
                            ? "secondary"
                            : voter.status === VoterStatus.VOTED
                              ? "default"
                              : "destructive"
                        }
                      >
                        {voter.status.toLowerCase()}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {new Date(voter.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm line-clamp-1">
                      <span className="font-medium">Election:</span>{" "}
                      {voter.election.name}
                    </div>
                    <div className="text-sm line-clamp-1">
                      <span className="font-medium">Department:</span>{" "}
                      {voter.department.name}
                    </div>
                    <div className="text-sm">
                      {voter.credentialsSent ? (
                        <span className="text-green-600">Credentials sent</span>
                      ) : (
                        <span className="text-orange-600">
                          Pending credentials
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
