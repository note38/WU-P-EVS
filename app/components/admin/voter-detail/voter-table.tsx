"use client";

// Utility function to convert image to data URL
async function getImageAsDataUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Could not get canvas context"));
      }
    };
    img.onerror = () => {
      reject(new Error("Could not load image"));
    };
    img.src = imageUrl;
  });
}

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  PrinterIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";
import { Voter, VoterStatus } from "./voter-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditIcon, MoreHorizontal, TrashIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EditVoterForm } from "./edit-voter-form";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface VoterTableProps {
  voters: Voter[];
  info?: any | null;
  onVoterUpdate?: (updatedVoter: Voter) => void;
  onVoterDelete?: (voterId: number) => void;
}

export default function VoterTable({
  voters,
  info,
  onVoterUpdate,
  onVoterDelete,
}: VoterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voterToDelete, setVoterToDelete] = useState<Voter | null>(null);
  const itemsPerPage = 10;

  const getFullName = (voter: Voter) => {
    return `${voter.firstName} ${voter.middleName} ${voter.lastName}`
      .trim()
      .replace(/\s+/g, " ");
  };

  // Get unique year names for filtering
  const yearNames = Array.from(
    new Set(voters.map((voter) => voter.year?.name || "Unknown"))
  );

  const filteredVoters = voters.filter((voter) => {
    const fullName = getFullName(voter);
    const searchLower = searchTerm.toLowerCase();

    // Search match
    const matchesSearch =
      fullName.toLowerCase().includes(searchLower) ||
      voter.email.toLowerCase().includes(searchLower) ||
      voter.id.toString().includes(searchLower);

    // Year filter match
    const matchesYearFilter =
      selectedYearFilter === "all" || voter.year?.name === selectedYearFilter;

    return matchesSearch && matchesYearFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVoters = filteredVoters.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const toggleVoterSelection = (voterId: number) => {
    setSelectedVoters((prev) =>
      prev.includes(voterId)
        ? prev.filter((id) => id !== voterId)
        : [...prev, voterId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVoters.length === paginatedVoters.length) {
      // If all currently displayed voters are selected, unselect them
      const currentPageVoterIds = paginatedVoters.map((voter) => voter.id);
      setSelectedVoters((prev) =>
        prev.filter((id) => !currentPageVoterIds.includes(id))
      );
    } else {
      // Otherwise, select all currently displayed voters
      const currentPageVoterIds = paginatedVoters.map((voter) => voter.id);
      setSelectedVoters((prev) => {
        const newSelection = [...prev];
        currentPageVoterIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handlePrintAll = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get the base URL for absolute paths
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "http://localhost:3000";

    // Try to get the logo as a data URL, fallback to URL if it fails
    let logoSrc = `${baseUrl}/wup-logo.png`;
    try {
      logoSrc = await getImageAsDataUrl(`${baseUrl}/wup-logo.png`);
    } catch (error) {
      console.warn(
        "Could not convert logo to data URL, using URL instead:",
        error
      );
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Voters - Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .election-header {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 24px;
              background-color: #ffffff;
              border-bottom: 1px solid #dee2e6;
              text-align: center;
            }
            .branding {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 16px;
              margin-bottom: 16px;
            }
            .logo {
              width: 60px;
              height: 60px;
            }
            .university-info {
              text-align: left;
            }
            .university-name {
              margin: 0;
              font-size: 1.5rem;
              font-weight: 600;
              color: #212529;
            }
            .system-name {
              margin: 0;
              font-size: 1rem;
              color: #6c757d;
            }
            .election-title {
              margin: 0;
              font-size: 1.25rem;
              font-weight: 500;
              color: #495057;
              background-color: #f8f9fa;
              padding: 8px 12px;
              border-radius: 8px;
              display: inline-block;
            }
            .voter-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }
            .voter-table th, .voter-table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            .voter-table th { 
              background-color: #f2f2f2; 
              font-weight: bold;
            }
            .voter-table tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .status-voted { 
              background-color: #d4edda; 
              color: #155724; 
              padding: 2px 6px; 
              border-radius: 3px;
            }
            .status-uncast { 
              background-color: #d1ecf1; 
              color: #0c5460; 
              padding: 2px 6px; 
              border-radius: 3px;
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              color: #666; 
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <header class="election-header">
            <div class="branding">
              <img src="${logoSrc}" alt="Wesleyan University Philippines Logo" class="logo" onerror="this.onerror=null;this.src='https://via.placeholder.com/60x60/cccccc/000000?text=WUP';" />
              <div class="university-info">
                <h1 class="university-name">Wesleyan University-Philippines</h1>
                <p class="system-name">Enhanced Voting System</p>
              </div>
            </div>
            <h2 class="election-title">All Voters Report</h2>
            <p><strong>Total Voters:</strong> ${filteredVoters.length}</p>
          </header>
          <table class="voter-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Year</th>
                <th>Department</th>
                <th>Status</th>
                <th>Election</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${filteredVoters
                .map((voter) => {
                  const fullName = getFullName(voter);
                  const yearName = voter.year?.name || "Unknown";
                  // Try multiple sources for department name
                  let departmentName = "Not assigned";
                  if (voter.year?.department?.name) {
                    departmentName = voter.year.department.name;
                  } else if (voter.year?.name) {
                    const parts = voter.year.name.split(" - ");
                    if (parts.length > 1) {
                      departmentName = parts[1];
                    }
                  }

                  return `
                    <tr>
                      <td>${voter.id}</td>
                      <td>${fullName}</td>
                      <td>${voter.email}</td>
                      <td>${yearName}</td>
                      <td>${departmentName}</td>
                      <td>
                        <span class="${voter.status === "CAST" ? "status-voted" : "status-uncast"}">
                          ${voter.status.toLowerCase()}
                        </span>
                      </td>
                      <td>${voter.election?.name || "Not assigned"}</td>
                      <td>${new Date(voter.createdAt).toLocaleDateString()}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>This report contains ${filteredVoters.length} voters.</p>
            <p>Generated by: Wesleyan University Philippines - Enhanced Voting System</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handlePrintSelected = async () => {
    if (selectedVoters.length === 0) {
      alert("Please select voters to print");
      return;
    }

    const selectedVoterData = filteredVoters.filter((voter) =>
      selectedVoters.includes(voter.id)
    );
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get the base URL for absolute paths
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "http://localhost:3000";

    // Try to get the logo as a data URL, fallback to URL if it fails
    let logoSrc = `${baseUrl}/wup-logo.png`;
    try {
      logoSrc = await getImageAsDataUrl(`${baseUrl}/wup-logo.png`);
    } catch (error) {
      console.warn(
        "Could not convert logo to data URL, using URL instead:",
        error
      );
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Selected Voters - Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .election-header {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 24px;
              background-color: #ffffff;
              border-bottom: 1px solid #dee2e6;
              text-align: center;
            }
            .branding {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 16px;
              margin-bottom: 16px;
            }
            .logo {
              width: 60px;
              height: 60px;
            }
            .university-info {
              text-align: left;
            }
            .university-name {
              margin: 0;
              font-size: 1.5rem;
              font-weight: 600;
              color: #212529;
            }
            .system-name {
              margin: 0;
              font-size: 1rem;
              color: #6c757d;
            }
            .election-title {
              margin: 0;
              font-size: 1.25rem;
              font-weight: 500;
              color: #495057;
              background-color: #f8f9fa;
              padding: 8px 12px;
              border-radius: 8px;
              display: inline-block;
            }
            .voter-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }
            .voter-table th, .voter-table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            .voter-table th { 
              background-color: #f2f2f2; 
              font-weight: bold;
            }
            .voter-table tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .status-voted { 
              background-color: #d4edda; 
              color: #155724; 
              padding: 2px 6px; 
              border-radius: 3px;
            }
            .status-uncast { 
              background-color: #d1ecf1; 
              color: #0c5460; 
              padding: 2px 6px; 
              border-radius: 3px;
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              color: #666; 
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <header class="election-header">
            <div class="branding">
              <img src="${logoSrc}" alt="Wesleyan University Philippines Logo" class="logo" onerror="this.onerror=null;this.src='https://via.placeholder.com/60x60/cccccc/000000?text=WUP';" />
              <div class="university-info">
                <h1 class="university-name">Wesleyan University-Philippines</h1>
                <p class="system-name">Enhanced Voting System</p>
              </div>
            </div>
            <h2 class="election-title">Selected Voters Report</h2>
            <p><strong>Selected Voters:</strong> ${selectedVoterData.length}</p>
          </header>
          <table class="voter-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Year</th>
                <th>Department</th>
                <th>Status</th>
                <th>Election</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${selectedVoterData
                .map((voter) => {
                  const fullName = getFullName(voter);
                  const yearName = voter.year?.name || "Unknown";
                  // Try multiple sources for department name
                  let departmentName = "Not assigned";
                  if (voter.year?.department?.name) {
                    departmentName = voter.year.department.name;
                  } else if (voter.year?.name) {
                    const parts = voter.year.name.split(" - ");
                    if (parts.length > 1) {
                      departmentName = parts[1];
                    }
                  }

                  return `
                    <tr>
                      <td>${voter.id}</td>
                      <td>${fullName}</td>
                      <td>${voter.email}</td>
                      <td>${yearName}</td>
                      <td>${departmentName}</td>
                      <td>
                        <span class="${voter.status === "CAST" ? "status-voted" : "status-uncast"}">
                          ${voter.status.toLowerCase()}
                        </span>
                      </td>
                      <td>${voter.election?.name || "Not assigned"}</td>
                      <td>${new Date(voter.createdAt).toLocaleDateString()}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>This report contains ${selectedVoterData.length} selected voters.</p>
            <p>Generated by: Wesleyan University Philippines - Enhanced Voting System</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Handle voter edit
  const handleEditVoter = (voterId: number) => {
    // Find the voter data
    const voter = voters.find((v) => v.id === voterId);
    if (!voter) {
      toast({
        title: "Error",
        description: "Voter not found.",
        variant: "destructive",
      });
      return;
    }

    // Set the selected voter and open the edit dialog
    setSelectedVoter(voter);
    setEditDialogOpen(true);
  };

  // Handle voter delete - open confirmation dialog
  const handleDeleteVoter = (voter: Voter) => {
    setVoterToDelete(voter);
    setDeleteDialogOpen(true);
  };

  // Perform the actual deletion
  const performDeleteVoter = async () => {
    if (!voterToDelete) return;

    try {
      const response = await fetch(`/api/voters/${voterToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Voter deleted successfully.",
        });

        // Notify parent component to refresh the voter list
        if (onVoterDelete) {
          onVoterDelete(voterToDelete.id);
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete voter.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting voter:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the voter.",
        variant: "destructive",
      });
    } finally {
      setVoterToDelete(null);
    }
  };

  // Handle voter update
  const handleVoterUpdated = () => {
    // Close the dialog
    setEditDialogOpen(false);
    setSelectedVoter(null);

    // Show success message
    toast({
      title: "Success",
      description: "Voter updated successfully.",
    });

    // Notify parent component to refresh the voter list
    if (onVoterUpdate) {
      onVoterUpdate(selectedVoter as Voter);
    }
  };

  // Pagination functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  return (
    <div className="space-y-4">
      {/* Edit Voter Dialog */}
      {selectedVoter && (
        <EditVoterForm
          voter={selectedVoter}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onVoterUpdated={handleVoterUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={performDeleteVoter}
        itemName={
          voterToDelete
            ? `${voterToDelete.firstName} ${voterToDelete.lastName}`
            : ""
        }
        itemType="voter"
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
          <Input
            placeholder="Search voters (name, email, ID)..."
            className="w-full sm:max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {yearNames.length > 1 && (
            <Select
              value={selectedYearFilter}
              onValueChange={setSelectedYearFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearNames.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintAll}
            disabled={filteredVoters.length === 0}
          >
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print All
          </Button>

          {selectedVoters.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedVoters.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={handlePrintSelected}>
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print Selected
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    paginatedVoters.length > 0 &&
                    paginatedVoters.every((voter) =>
                      selectedVoters.includes(voter.id)
                    )
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Election</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVoters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  No voters found
                </TableCell>
              </TableRow>
            ) : (
              paginatedVoters.map((voter) => {
                const fullName = getFullName(voter);
                const yearName = voter.year?.name || "Unknown";
                // Try multiple sources for department name
                let departmentName = "Not assigned";
                if (voter.year?.department?.name) {
                  departmentName = voter.year.department.name;
                } else if (voter.year?.name) {
                  // Fallback: try to extract from year name if department is missing
                  const parts = voter.year.name.split(" - ");
                  if (parts.length > 1) {
                    departmentName = parts[1];
                  }
                }

                return (
                  <TableRow
                    key={voter.id}
                    className={
                      selectedVoters.includes(voter.id) ? "bg-muted" : ""
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedVoters.includes(voter.id)}
                        onCheckedChange={() => toggleVoterSelection(voter.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{voter.id}</TableCell>
                    <TableCell>{fullName}</TableCell>
                    <TableCell>{voter.email}</TableCell>
                    <TableCell>{yearName}</TableCell>
                    <TableCell>{departmentName}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          voter.status === VoterStatus.CAST
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {voter.status.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {voter.election?.name || "Not assigned"}
                    </TableCell>
                    <TableCell>
                      {new Date(voter.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEditVoter(voter.id)}
                          >
                            <EditIcon className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVoter(voter);
                            }}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredVoters.length)} of{" "}
            {filteredVoters.length} voters
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
