"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EditIcon,
  EyeIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SearchInput } from "../search-input";

interface Voter {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  avatar: string;
  department: string; // Department name
  year: string; // Year name
  yearId: number;
}

interface Candidate {
  id: number;
  name: string;
  position: string;
  party: string;
  votes: number;
  avatar: string;
  department?: string;
  year?: string;
}

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
    voterId: 0,
    avatar: "",
    yearId: 0,
  });
  const [positions, setPositions] = useState<any[]>([]);
  const [partylists, setPartylists] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [voterSearchTerm, setVoterSearchTerm] = useState("");
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [formStep, setFormStep] = useState<"search" | "details">("search");
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data when component mounts
  useEffect(() => {
    fetchVoters();
    fetchPositions();
    fetchPartylists();
    fetchCandidates();
  }, [electionId]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/elections/${electionId}/voters`);
      if (response.ok) {
        const data = await response.json();
        // Format voters to include full name and department/year info
        const formattedVoters = data.map((voter: any) => ({
          id: voter.id,
          firstName: voter.firstName,
          lastName: voter.lastName,
          middleName: voter.middleName,
          name: `${voter.lastName}, ${voter.firstName} ${voter.middleName || ""}`.trim(),
          email: voter.email,
          avatar: voter.avatar || "/placeholder.svg",
          department: voter.department?.name || "N/A",
          year: voter.year?.name || "N/A",
          yearId: voter.yearId,
        }));
        setVoters(formattedVoters);
      } else {
        console.error("Failed to fetch voters");
      }
    } catch (error) {
      console.error("Error fetching voters:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await fetch(`/api/elections/${electionId}/positions`);
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  const fetchPartylists = async () => {
    try {
      const response = await fetch(`/api/elections/${electionId}/partylists`);
      if (response.ok) {
        const data = await response.json();
        setPartylists(data);
      }
    } catch (error) {
      console.error("Error fetching partylists:", error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`/api/elections/${electionId}/candidates`);
      if (response.ok) {
        const data = await response.json();
        setCandidates(data);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  // Add default Independent option if not already present
  const getPartylistOptions = () => {
    // Check if "Independent" already exists in the fetched partylists
    const hasIndependent = partylists.some(
      (p) => p.name.toLowerCase() === "independent"
    );

    if (hasIndependent) {
      return partylists;
    } else {
      // If no partylists at all, create a default one with a numeric ID
      if (partylists.length === 0) {
        // Using -1 as a special ID for Independent when it's not in the database
        return [{ id: -1, name: "Independent" }];
      }
      // Otherwise append Independent to the existing partylists
      return [...partylists, { id: -1, name: "Independent" }];
    }
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.party.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVoters = voters.filter(
    (voter) =>
      voter.name.toLowerCase().includes(voterSearchTerm.toLowerCase()) ||
      voter.email.toLowerCase().includes(voterSearchTerm.toLowerCase()) ||
      voter.department.toLowerCase().includes(voterSearchTerm.toLowerCase()) ||
      voter.year.toLowerCase().includes(voterSearchTerm.toLowerCase())
  );

  // Automatically set Independent as default partylist when selecting a voter
  const handleSelectVoter = (voter: Voter) => {
    // Find Independent in partylists or use first partylist as fallback
    const partylistOptions = getPartylistOptions();
    const independent = partylistOptions.find(
      (p) => p.name.toLowerCase() === "independent"
    );
    const defaultPartylist = independent
      ? independent.id.toString()
      : partylistOptions.length > 0
        ? partylistOptions[0].id.toString()
        : "";

    setSelectedVoter(voter);
    setNewCandidate({
      ...newCandidate,
      name: voter.name,
      voterId: voter.id,
      avatar: voter.avatar,
      party: defaultPartylist, // Set default partylist
      yearId: voter.yearId, // Store yearId
    });
    setCustomAvatar(null);
    setVoterSearchTerm("");
    setFormStep("details");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomAvatar(result);
        setNewCandidate({
          ...newCandidate,
          avatar: result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleBackToSearch = () => {
    setFormStep("search");
  };

  const resetForm = () => {
    setNewCandidate({
      name: "",
      position: "",
      party: "",
      voterId: 0,
      avatar: "",
      yearId: 0,
    });
    setSelectedVoter(null);
    setCustomAvatar(null);
    setVoterSearchTerm("");
    setFormStep("search");
  };

  const handleAddCandidate = async () => {
    if (!selectedVoter) {
      console.error("Please select a voter");
      return;
    }

    if (!newCandidate.position) {
      console.error("Please select a position");
      return;
    }

    if (!newCandidate.party) {
      console.error("Please select a party/affiliation");
      return;
    }

    try {
      // Get partylist ID - special handling for 'Independent' which might be a special value
      const partylistId = parseInt(newCandidate.party);

      // Prepare the request body
      const requestBody: any = {
        name: newCandidate.name,
        positionId: parseInt(newCandidate.position),
        electionId: electionId,
        voterId: newCandidate.voterId,
        avatar: newCandidate.avatar,
        yearId: newCandidate.yearId,
      };

      // Special handling for Independent party (ID -1)
      if (partylistId === -1) {
        // For Independent, send the name directly rather than an ID
        requestBody.partylist = "Independent";
      } else {
        // For normal partylists, send the ID
        requestBody.partylistId = partylistId;
      }

      const response = await fetch(`/api/elections/${electionId}/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log("Candidate added successfully");
        // Refresh candidates list
        fetchCandidates();
        // Close dialog and reset form
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        const errorData = await response.json();
        console.error(errorData.error || "Failed to add candidate");
        // You could add alert/toast here to show error to user
      }
    } catch (error) {
      console.error("Error adding candidate:", error);
      // You could add alert/toast here to show error to user
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    resetForm();
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
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
              <DialogDescription>
                Add a new candidate to run for a position in this election.
              </DialogDescription>
            </DialogHeader>

            {formStep === "search" ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="voter-search">Search Voter</Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="voter-search"
                      placeholder="Search by name, email, department or year..."
                      className="pl-10"
                      value={voterSearchTerm}
                      onChange={(e) => setVoterSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="border rounded-md">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-pulse text-muted-foreground">
                        Loading voters...
                      </div>
                    </div>
                  ) : filteredVoters.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {filteredVoters.map((voter) => (
                        <div
                          key={voter.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted rounded transition-colors cursor-pointer"
                          onClick={() => handleSelectVoter(voter)}
                        >
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage
                              src={voter.avatar || "/placeholder.svg"}
                              alt={voter.name}
                            />
                            <AvatarFallback>
                              {voter.firstName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {voter.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {voter.email}
                            </div>
                            <div className="text-xs font-medium">
                              <Badge variant="outline" className="mr-1">
                                {voter.department}
                              </Badge>
                              <Badge variant="secondary">{voter.year}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : voterSearchTerm ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No voters found matching "{voterSearchTerm}"
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      Start typing to search for voters
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 border-2 border-border">
                        <AvatarImage
                          src={
                            customAvatar ||
                            selectedVoter?.avatar ||
                            "/placeholder.svg"
                          }
                          alt={selectedVoter?.name || "Avatar"}
                        />
                        <AvatarFallback className="text-2xl">
                          {selectedVoter?.firstName.charAt(0) || (
                            <UserIcon className="h-8 w-8" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        onClick={triggerFileInput}
                      >
                        <UploadIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerFileInput}
                      className="text-xs"
                    >
                      Change Avatar
                    </Button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Selected Voter
                      </Label>
                      <div className="font-medium text-lg">
                        {selectedVoter?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedVoter?.email}
                      </div>
                      <div className="mt-1">
                        <Badge variant="outline" className="mr-1">
                          {selectedVoter?.department}
                        </Badge>
                        <Badge variant="secondary">{selectedVoter?.year}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToSearch}
                      className="mt-2 text-xs"
                    >
                      Change Voter
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="candidate-position">Position</Label>
                    <Select
                      onValueChange={(value) =>
                        setNewCandidate({ ...newCandidate, position: value })
                      }
                      value={newCandidate.position}
                    >
                      <SelectTrigger id="candidate-position">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((position: any) => (
                          <SelectItem
                            key={position.id}
                            value={position.id.toString()}
                          >
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="candidate-party">Party/Affiliation</Label>
                    <Select
                      onValueChange={(value) =>
                        setNewCandidate({ ...newCandidate, party: value })
                      }
                      value={newCandidate.party}
                    >
                      <SelectTrigger id="candidate-party">
                        <SelectValue placeholder="Select party/affiliation" />
                      </SelectTrigger>
                      <SelectContent>
                        {getPartylistOptions().map((partylist: any) => (
                          <SelectItem
                            key={partylist.id}
                            value={partylist.id.toString()}
                          >
                            {partylist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                className="sm:order-1 order-2"
              >
                Cancel
              </Button>
              {formStep === "details" && (
                <Button
                  onClick={handleAddCandidate}
                  className="sm:order-2 order-1"
                  disabled={!newCandidate.position || !newCandidate.party}
                >
                  Add Candidate
                </Button>
              )}
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
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Department/Year</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              candidate.avatar ||
                              "/placeholder.svg?height=40&width=40"
                            }
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
                      {candidate.year && (
                        <>
                          <Badge variant="outline" className="mr-1">
                            {candidate.department || "N/A"}
                          </Badge>
                          <Badge variant="secondary">{candidate.year}</Badge>
                        </>
                      )}
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
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No candidates found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
