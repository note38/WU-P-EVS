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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  EditIcon,
  PrinterIcon,
  SendIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SearchInput } from "../search-input";
import { ImportVotersDialog } from "./import-voter";
import { AddVoterForm } from "./add-voter-form";

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [yearFilter, setYearFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [voters, setVoters] = useState<Voter[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVoters, setTotalVoters] = useState(0);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [voterToRemove, setVoterToRemove] = useState<Voter | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch voters and filter options when component mounts
  useEffect(() => {
    fetchVoters(1); // Reset to page 1
    fetchYears();
    fetchDepartments();
  }, [electionId]);

  // Fetch voters when page changes or filters change
  useEffect(() => {
    fetchVoters(currentPage);
  }, [currentPage, debouncedSearchTerm, yearFilter, departmentFilter]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchVoters(1);
    }
  }, [debouncedSearchTerm, yearFilter, departmentFilter]);

  const fetchVoters = async (page: number = 1) => {
    setLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "8",
        _t: Date.now().toString(), // Cache busting
      });

      // Add search term if present
      if (debouncedSearchTerm.trim()) {
        params.append("search", debouncedSearchTerm.trim());
      }

      // Add year filter if not 'all'
      if (yearFilter !== "all") {
        params.append("year", yearFilter);
      }

      // Add department filter if not 'all'
      if (departmentFilter !== "all") {
        params.append("department", departmentFilter);
      }

      const response = await fetch(
        `/api/elections/${electionId}/voters?${params.toString()}`
      );
      const data = await response.json();

      if (response.ok) {
        console.log("Voters data from API:", data);

        setVoters(data.voters);
        setSelectedVoters([]); // Clear selections when changing pages
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setTotalVoters(data.pagination.total || 0);
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
    // Optimistic update: immediately remove from UI
    const originalVoters = [...voters];
    setVoters((prevVoters) =>
      prevVoters.filter((voter) => voter.id !== voterId)
    );
    setSelectedVoters((prev) => prev.filter((id) => id !== voterId));

    try {
      const response = await fetch(
        `/api/elections/${electionId}/voters/remove`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ voterIds: [voterId] }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Voter removed from election successfully",
        });
        // Refresh in background to ensure consistency
        setTimeout(() => {
          fetchVoters(currentPage);
        }, 500);
      } else {
        // Revert optimistic update on error
        setVoters(originalVoters);
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to remove voter from election",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setVoters(originalVoters);
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
        fetchVoters(currentPage); // Refresh to update the sent status
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

  const handleImportSuccess = () => {
    setCurrentPage(1);
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setYearFilter("all");
    setDepartmentFilter("all");
    fetchVoters(1);
  };

  const handleVoterAdded = (newVoter: any) => {
    // Reset filters and search to show the new voter
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setYearFilter("all");
    setDepartmentFilter("all");
    setCurrentPage(1);

    // Refresh the data to show the new voter
    setTimeout(() => {
      fetchVoters(1);
    }, 500);
  };

  const toggleSelectAll = () => {
    if (selectedVoters.length === voters.length) {
      setSelectedVoters([]);
    } else {
      setSelectedVoters(voters.map((voter) => voter.id));
    }
  };

  const toggleSelectVoter = (id: number) => {
    if (selectedVoters.includes(id)) {
      setSelectedVoters(selectedVoters.filter((voterId) => voterId !== id));
    } else {
      setSelectedVoters([...selectedVoters, id]);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show current page and surrounding pages
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  const handleRemoveClick = (voter: Voter) => {
    setVoterToRemove(voter);
    setIsRemoveDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    if (voterToRemove) {
      handleDeleteVoter(voterToRemove.id);
      setIsRemoveDialogOpen(false);
      setVoterToRemove(null);
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
          <AddVoterForm
            electionId={electionId}
            onVoterAdded={handleVoterAdded}
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
                      selectedVoters.length === voters.length &&
                      voters.length > 0
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
              ) : voters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    No voters found for this election. Use the "Import Voters"
                    or "Add Voter" button to add voters.
                  </TableCell>
                </TableRow>
              ) : (
                voters.map((voter) => (
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
                          onClick={() => handleRemoveClick(voter)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 8 + 1} to{" "}
            {Math.min(currentPage * 8, totalVoters)} of {totalVoters} voters
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageClick(pageNumber)}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Voter from Election</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {voterToRemove &&
                  `${voterToRemove.firstName} ${voterToRemove.middleName ? voterToRemove.middleName + " " : ""}${voterToRemove.lastName}`.trim()}
              </strong>{" "}
              from this election? This will not delete the voter from the
              system, only remove them from this specific election.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVoterToRemove(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove from Election
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
