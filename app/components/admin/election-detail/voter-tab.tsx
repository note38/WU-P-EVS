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
  const [isBulkRemoveDialogOpen, setIsBulkRemoveDialogOpen] = useState(false);

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

  const handleBulkDeleteVoters = async () => {
    if (selectedVoters.length === 0) return;

    // Optimistic update: immediately remove from UI
    const originalVoters = [...voters];
    const originalSelectedVoters = [...selectedVoters];

    setVoters((prevVoters) =>
      prevVoters.filter((voter) => !selectedVoters.includes(voter.id))
    );
    setSelectedVoters([]);

    try {
      const response = await fetch(
        `/api/elections/${electionId}/voters/remove`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ voterIds: selectedVoters }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `${selectedVoters.length} voter(s) removed from election successfully`,
        });
        // Refresh in background to ensure consistency
        setTimeout(() => {
          fetchVoters(currentPage);
        }, 500);
      } else {
        // Revert optimistic update on error
        setVoters(originalVoters);
        setSelectedVoters(originalSelectedVoters);
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to remove voters from election",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setVoters(originalVoters);
      setSelectedVoters(originalSelectedVoters);
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
          <title>All Voters - Election Report</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.6;
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
              font-size: 0.9rem;
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
              .voter-table { font-size: 0.8rem; }
              .voter-table th, .voter-table td { padding: 4px; }
            }
            @media (max-width: 768px) {
              body { margin: 10px; }
              .branding { flex-direction: column; text-align: center; }
              .university-info { text-align: center; }
              .election-title { font-size: 1rem; padding: 6px 10px; }
              .voter-table { font-size: 0.8rem; }
              .voter-table th, .voter-table td { padding: 6px; }
            }
            @media (max-width: 480px) {
              .election-header { padding: 15px; }
              .logo { width: 40px; height: 40px; }
              .university-name { font-size: 1.2rem; }
              .system-name { font-size: 0.9rem; }
              .election-title { font-size: 0.9rem; padding: 4px 8px; }
              .voter-table { font-size: 0.7rem; }
              .voter-table th, .voter-table td { padding: 4px; }
              .status-voted, .status-uncast { padding: 1px 3px; font-size: 0.6rem; }
            }
          </style>
        </head>
        <body>
          <header class="election-header">
            <div class="branding">
              <img src="${logoSrc}" alt="Wesleyan University Philippines Logo" class="logo" onerror="this.onerror=null;this.src='https://via.placeholder.com/60x60/cccccc/000000?text=WUP';" />
              <div class="university-info">
                <h1 class="university-name">Wesleyan University-Philippines</h1>
                <p class="system-name">Develop Voting System</p>
              </div>
            </div>
            <h2 class="election-title">All Voters Report</h2>
            <p><strong>Total Voters:</strong> ${voters.length}</p>
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
                <th>Voted At</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${voters
                .map((voter) => {
                  // Try to get department name from the voter object
                  let departmentName = "Not assigned";
                  if (voter.department?.name) {
                    departmentName = voter.department.name;
                  } else if (voter.year?.name) {
                    // Try to extract department from year name if it contains department info
                    const parts = voter.year.name.split(" - ");
                    if (parts.length > 1) {
                      departmentName = parts[1];
                    }
                  }

                  return `
                    <tr>
                      <td>${voter.id}</td>
                      <td>${voter.firstName} ${voter.middleName} ${voter.lastName}</td>
                      <td>${voter.email}</td>
                      <td>${voter.year?.name || "Unknown"}</td>
                      <td>${departmentName}</td>
                      <td>
                        <span class="${voter.votedAt ? "status-voted" : "status-uncast"}">
                          ${voter.votedAt ? "Voted" : "Not Voted"}
                        </span>
                      </td>
                      <td>${voter.votedAt ? new Date(voter.votedAt).toLocaleDateString() : "Not yet voted"}</td>
                      <td>${new Date().toLocaleDateString()}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>This report contains ${voters.length} voters.</p>
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
      toast({
        title: "No Selection",
        description: "Please select voters to print",
        variant: "destructive",
      });
      return;
    }

    const selectedVoterData = voters.filter((voter) =>
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
          <title>Selected Voters - Election Report</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.6;
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
              font-size: 0.9rem;
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
              .voter-table { font-size: 0.8rem; }
              .voter-table th, .voter-table td { padding: 4px; }
            }
            @media (max-width: 768px) {
              body { margin: 10px; }
              .branding { flex-direction: column; text-align: center; }
              .university-info { text-align: center; }
              .election-title { font-size: 1rem; padding: 6px 10px; }
              .voter-table { font-size: 0.8rem; }
              .voter-table th, .voter-table td { padding: 6px; }
            }
            @media (max-width: 480px) {
              .election-header { padding: 15px; }
              .logo { width: 40px; height: 40px; }
              .university-name { font-size: 1.2rem; }
              .system-name { font-size: 0.9rem; }
              .election-title { font-size: 0.9rem; padding: 4px 8px; }
              .voter-table { font-size: 0.7rem; }
              .voter-table th, .voter-table td { padding: 4px; }
              .status-voted, .status-uncast { padding: 1px 3px; font-size: 0.6rem; }
            }
          </style>
        </head>
        <body>
          <header class="election-header">
            <div class="branding">
              <img src="${logoSrc}" alt="Wesleyan University Philippines Logo" class="logo" onerror="this.onerror=null;this.src='https://via.placeholder.com/60x60/cccccc/000000?text=WUP';" />
              <div class="university-info">
                <h1 class="university-name">Wesleyan University-Philippines</h1>
                <p class="system-name">Develop Voting System</p>
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
                <th>Voted At</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${selectedVoterData
                .map((voter) => {
                  // Try to get department name from the voter object
                  let departmentName = "Not assigned";
                  if (voter.department?.name) {
                    departmentName = voter.department.name;
                  } else if (voter.year?.name) {
                    // Try to extract department from year name if it contains department info
                    const parts = voter.year.name.split(" - ");
                    if (parts.length > 1) {
                      departmentName = parts[1];
                    }
                  }

                  return `
                    <tr>
                      <td>${voter.id}</td>
                      <td>${voter.firstName} ${voter.middleName} ${voter.lastName}</td>
                      <td>${voter.email}</td>
                      <td>${voter.year?.name || "Unknown"}</td>
                      <td>${departmentName}</td>
                      <td>
                        <span class="${voter.votedAt ? "status-voted" : "status-uncast"}">
                          ${voter.votedAt ? "Voted" : "Not Voted"}
                        </span>
                      </td>
                      <td>${voter.votedAt ? new Date(voter.votedAt).toLocaleDateString() : "Not yet voted"}</td>
                      <td>${new Date().toLocaleDateString()}</td>
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

    // Add print event handling
    let printed = false;

    const beforePrintHandler = () => {
      printed = true;
    };

    const afterPrintHandler = () => {
      printWindow.removeEventListener("beforeprint", beforePrintHandler);
      printWindow.removeEventListener("afterprint", afterPrintHandler);
      // Close window after printing
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 1000);
    };

    printWindow.addEventListener("beforeprint", beforePrintHandler);
    printWindow.addEventListener("afterprint", afterPrintHandler);

    // Handle window close without printing
    const checkClosed = setInterval(() => {
      if (printWindow.closed) {
        clearInterval(checkClosed);
        // If not printed, it was cancelled
        if (!printed) {
          toast({
            title: "Print Cancelled",
            description: "Print operation was cancelled.",
          });
        }
      }
    }, 1000);

    try {
      printWindow.print();
    } catch (error) {
      clearInterval(checkClosed);
      toast({
        title: "Print Error",
        description: "Failed to initiate print dialog.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Election Voters</h2>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handlePrintAll}
            disabled={voters.length === 0}
            className="w-full sm:w-auto"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print All
          </Button>
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
          className="w-full sm:max-w-md"
        />

        <div className="flex flex-wrap gap-2 ml-auto w-full sm:w-auto">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {selectedVoters.length} selected
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintSelected}
                className="w-full sm:w-auto"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkRemoveDialogOpen(true)}
                className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Remove Selected
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
                        {voter.votedAt ? "Voted" : "Not Voted"}
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

      {/* Bulk Remove Confirmation Dialog */}
      <AlertDialog
        open={isBulkRemoveDialogOpen}
        onOpenChange={setIsBulkRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Voters from Election</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{selectedVoters.length} selected voter(s)</strong> from
              this election? This will not delete the voters from the system,
              only remove them from this specific election.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleBulkDeleteVoters();
                setIsBulkRemoveDialogOpen(false);
              }}
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
