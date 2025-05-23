"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { EditIcon, PrinterIcon, SendIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchInput } from "../search-input";
import { ImportVotersDialog } from "./import-voter";

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
  votedAt?: string | null;
  electionId: number | null;
  credentialsSent?: boolean;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch voters and filter options when component mounts
  useEffect(() => {
    fetchVoters(1, true); // Reset to page 1 and replace voters
    fetchYears();
    fetchDepartments();
  }, [electionId]);

  const fetchVoters = async (page: number = 1, replace: boolean = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetch(
        `/api/elections/${electionId}/voters?page=${page}&limit=8`
      );
      const data = await response.json();

      if (response.ok) {
        console.log("Voters data from API:", data);

        if (replace) {
          setVoters(data.voters);
        } else {
          setVoters((prev) => [...prev, ...data.voters]);
        }

        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setHasMore(data.pagination.hasMore);
      } else {
        console.error("Error response:", data);
        toast({
          title: "Error",
          description: data.error || "Failed to fetch voters",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching voters:", error);
      toast({
        title: "Error",
        description: "Failed to fetch voters. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchVoters(currentPage + 1, false);
    }
  };

  const handleImportSuccess = () => {
    setCurrentPage(1);
    fetchVoters(1, true); // Reset to page 1 and replace voters
  };

  const filteredVoters = voters.filter((voter) => {
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
            onImportSuccess={handleImportSuccess}
          />
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
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
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
                    No voters found for this election. Use the "Import Voters"
                    button to add voters.
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
                    <TableCell>{voter.department?.name || "N/A"}</TableCell>
                    <TableCell>{voter.year?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          voter.votedAt
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-500 hover:bg-gray-600"
                        }
                      >
                        {voter.votedAt ? "Voted" : "Registered"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {voter.votedAt
                        ? new Date(voter.votedAt).toLocaleDateString() +
                          " " +
                          new Date(voter.votedAt).toLocaleTimeString()
                        : "Not yet voted"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading more..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
