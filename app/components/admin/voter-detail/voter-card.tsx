"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  EditIcon,
  TrashIcon,
  EyeIcon,
  PrinterIcon,
  SendIcon,
  CheckIcon,
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
import { toast } from "@/hooks/use-toast";

// Type definition based on Prisma Voter model
type Voter = {
  id: number;
  voterId: string;
  name: string;
  email: string;
  status: "REGISTERED" | "VOTED" | "ABSENT";
  pollingStation?: string | null;
  credentialsSent: boolean;
  createdAt: Date;
};

export function VoterCards() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch voters from API route
  useEffect(() => {
    async function fetchVoters() {
      try {
        setIsLoading(true);
        const response = await fetch("api/voters");
        if (!response.ok) {
          throw new Error("Failed to fetch voters");
        }
        const data = await response.json();
        setVoters(data);
      } catch (error) {
        console.error("Error fetching voters:", error);
        toast({
          title: "Error",
          description: "Failed to load voters",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchVoters();
  }, []);

  const filteredVoters = voters.filter(
    (voter) =>
      voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.voterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedVoters.length === filteredVoters.length) {
      setSelectedVoters([]);
    } else {
      setSelectedVoters(filteredVoters.map((voter) => voter.id));
    }
  };

  const toggleSelectVoter = (id: number) => {
    if (selectedVoters.includes(id)) {
      setSelectedVoters(selectedVoters.filter((voterId) => voterId !== id));
    } else {
      setSelectedVoters([...selectedVoters, id]);
    }
  };

  // Function to get avatar fallback initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Function to get a deterministic color based on the name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-orange-500",
    ];
    const hash = name
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  // Handle bulk actions
  const handleBulkEmail = async () => {
    try {
      const response = await fetch("/api/voters/bulk-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voterIds: selectedVoters }),
      });

      if (!response.ok) {
        throw new Error("Failed to send bulk emails");
      }

      toast({
        title: "Success",
        description: `Emails sent to ${selectedVoters.length} voters`,
      });
    } catch (error) {
      console.error("Bulk email error:", error);
      toast({
        title: "Error",
        description: "Failed to send bulk emails",
        variant: "destructive",
      });
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span>Loading voters...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <Input
          placeholder="Search voters..."
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
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <Checkbox
                      checked={selectedVoters.includes(voter.id)}
                      onCheckedChange={() => toggleSelectVoter(voter.id)}
                      aria-label={`Select ${voter.name}`}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={`/api/placeholder/50/50`}
                        alt={voter.name}
                      />
                      <AvatarFallback className={getAvatarColor(voter.name)}>
                        {getInitials(voter.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-sm">{voter.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {voter.voterId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Badge
                      className={
                        voter.status === "VOTED"
                          ? "bg-green-500 hover:bg-green-600"
                          : voter.status === "REGISTERED"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      }
                    >
                      {voter.status === "VOTED"
                        ? "Voted"
                        : voter.status === "REGISTERED"
                        ? "Registered"
                        : "Absent"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-1"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit Voter
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <PrinterIcon className="mr-2 h-4 w-4" />
                          Print ID Card
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <SendIcon className="mr-2 h-4 w-4" />
                          Send Credentials
                        </DropdownMenuItem>
                        {voter.status !== "VOTED" && (
                          <DropdownMenuItem>
                            <CheckIcon className="mr-2 h-4 w-4" />
                            Mark as Voted
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete Voter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-sm space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Email:</span>
                    <span className="text-muted-foreground">{voter.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Registered At:</span>
                    <span className="text-muted-foreground">
                      {new Date(voter.createdAt).toLocaleString()}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Polling Station:</span>
                    <span className="text-muted-foreground">
                      {voter.pollingStation || "Not Assigned"}
                    </span>
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <EyeIcon className="mr-2 h-3 w-3" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <EditIcon className="mr-2 h-3 w-3" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
