"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  UploadIcon,
  PrinterIcon,
  SendIcon,
  EditIcon,
  TrashIcon,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

// Define types for the components
interface Year {
  id: number;
  name: string;
}

interface Voter {
  id: number;
  name: string;
  email: string;
  year: string;
  status: string;
  votedAt: string | null;
}

// Import Voters Dialog Component
function ImportVotersDialog({
  electionId,
  onImportSuccess,
}: {
  electionId: number;
  onImportSuccess: () => void;
}) {
  const [selectedYear, setSelectedYear] = useState("");
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch available years when dialog opens
  useEffect(() => {
    if (open) {
      fetchYears();
    }
  }, [open]);

  const fetchYears = async () => {
    try {
      const response = await fetch("/api/years");
      if (response.ok) {
        const data = await response.json();
        setYears(data);
      }
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const handleImport = async () => {
    if (!selectedYear) {
      toast({
        title: "Error",
        description: "Please select a year",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/elections/${electionId}/voters/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ yearId: selectedYear }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `${data.count} voters imported successfully`,
        });
        setOpen(false);
        if (onImportSuccess) onImportSuccess();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to import voters",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UploadIcon className="h-4 w-4 mr-2" />
          Import Voters
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Voters by Year</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="year">Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.id} value={year.id.toString()}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="mt-2"
            onClick={handleImport}
            disabled={loading}
          >
            {loading ? "Importing..." : "Import Selected Voters"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface VotersTabProps {
  electionId: number;
}

export function VotersTab({ electionId }: VotersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [yearFilter, setYearFilter] = useState("all");
  const [voters, setVoters] = useState<Voter[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch voters when component mounts
  useEffect(() => {
    fetchVoters();
    fetchYears();
  }, [electionId]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/elections/${electionId}/voters`);
      if (response.ok) {
        const data = await response.json();
        setVoters(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch voters",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching voters:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await fetch("/api/years");
      if (response.ok) {
        const data = await response.json();
        setYears(data);
      }
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const handleDeleteVoter = async (voterId: number) => {
    try {
      const response = await fetch(
        `/api/elections/${electionId}/voters/${voterId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Voter removed successfully",
        });
        fetchVoters(); // Refresh the list
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to remove voter",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSendCredentials = async (voterIds: number[]) => {
    try {
      const response = await fetch(
        `/api/elections/${electionId}/voters/send-credentials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ voterIds }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Credentials sent to ${data.count} voters`,
        });
        fetchVoters(); // Refresh to update the sent status
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to send credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const filteredVoters = voters.filter(
    (voter) =>
      (voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.id.toString().includes(searchTerm.toLowerCase())) &&
      (yearFilter === "all" || voter.year === yearFilter)
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Election Voters</h2>

        <div className="flex flex-wrap gap-2">
          <ImportVotersDialog
            electionId={electionId}
            onImportSuccess={fetchVoters}
          />
          <Button variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print Voters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedVoters.length > 0) {
                handleSendCredentials(selectedVoters);
              } else {
                toast({
                  title: "Selection Required",
                  description: "Please select voters to send credentials",
                  variant: "default",
                });
              }
            }}
          >
            <SendIcon className="h-4 w-4 mr-2" />
            Send Credentials
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <SearchInput
          placeholder="Search voters by name, email, or ID..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="max-w-md"
        />

        <div className="flex flex-wrap gap-2 ml-auto">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year.id} value={year.name}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedVoters.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground">
                {selectedVoters.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendCredentials(selectedVoters)}
              >
                <SendIcon className="h-4 w-4 mr-2" />
                Email Selected
              </Button>
            </div>
          )}
        </div>
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
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Voted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    Loading voters...
                  </TableCell>
                </TableRow>
              ) : filteredVoters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    No voters found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVoters.map((voter) => (
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
                    <TableCell>{voter.year}</TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVoter(voter.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
