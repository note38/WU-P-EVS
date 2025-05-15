"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import {
  EditIcon,
  PrinterIcon,
  SendIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SearchInput } from "../search-input";

// Define types for the components
interface Year {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Voter {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  avatar?: string;
  year: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
  status: string;
  votedAt?: string;
  electionId: number | null;
  credentialsSent?: boolean;
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
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [years, setYears] = useState<Year[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch available years and departments when dialog opens
  useEffect(() => {
    if (open) {
      fetchYears();
      fetchDepartments();
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

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
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
          body: JSON.stringify({
            yearId: selectedYear,
            departmentId: selectedDepartment || undefined,
          }),
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
          <DialogTitle>Import Voters by Year and Department</DialogTitle>
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

          <div className="grid gap-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
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
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [voters, setVoters] = useState<Voter[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch voters and filter options when component mounts
  useEffect(() => {
    fetchVoters();
    fetchYears();
    fetchDepartments();
  }, [electionId]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/elections/${electionId}/voters`);
      if (response.ok) {
        const data = await response.json();
        console.log("Voters data from API:", data);

        // Check if any voters exist for this election
        const electionVoters = data.filter(
          (voter: Voter) => voter.electionId === electionId
        );
        console.log(
          `Found ${electionVoters.length} voters for election ${electionId}`
        );

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

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
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

  const filteredVoters = voters.filter((voter) => {
    // Only include voters assigned to this election
    if (voter.electionId !== electionId) {
      return false;
    }

    const firstName = voter.firstName || "";
    const lastName = voter.lastName || "";
    const middleName = voter.middleName || "";
    const fullName = `${firstName} ${middleName} ${lastName}`
      .toLowerCase()
      .trim();
    const voterEmail = voter.email ? voter.email.toLowerCase() : "";
    const voterId = voter.id ? voter.id.toString() : "";

    // Handle year that could be an object or string
    let voterYear = "";
    if (voter.year && typeof voter.year === "object" && "name" in voter.year) {
      voterYear = voter.year.name;
    }

    // Get department name if exists
    let voterDepartment = "";
    if (
      voter.department &&
      typeof voter.department === "object" &&
      "name" in voter.department
    ) {
      voterDepartment = voter.department.name;
    }

    const searchTermLower = searchTerm.toLowerCase();

    return (
      (fullName.includes(searchTermLower) ||
        voterEmail.includes(searchTermLower) ||
        voterId.includes(searchTermLower)) &&
      (yearFilter === "all" || voterYear === yearFilter) &&
      (departmentFilter === "all" || voterDepartment === departmentFilter)
    );
  });

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

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.name}>
                  {department.name}
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
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Voted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    Loading voters...
                  </TableCell>
                </TableRow>
              ) : filteredVoters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
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
                        aria-label={`Select voter ${voter.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{voter.id}</TableCell>
                    <TableCell>
                      {`${voter.firstName} ${voter.middleName ? voter.middleName + " " : ""}${voter.lastName}`.trim()}
                    </TableCell>
                    <TableCell>{voter.email || "N/A"}</TableCell>
                    <TableCell>{voter.year?.name || "N/A"}</TableCell>
                    <TableCell>{voter.department?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          voter.status === "VOTED"
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-500 hover:bg-gray-600"
                        }
                      >
                        {voter.status === "VOTED" ? "Voted" : "Not Voted"}
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
