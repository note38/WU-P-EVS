"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EditIcon,
  MoreHorizontal,
  PrinterIcon,
  School,
  SendIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";

// Define VoterStatus enum since we don't have @prisma/client
export enum VoterStatus {
  REGISTERED = "REGISTERED",
  VOTED = "VOTED",
}

export type Voter = {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  status: VoterStatus;
  avatar: string;
  credentialsSent: boolean;
  createdAt: Date;
  election?: {
    name: string;
    id: number;
  };
  year?: {
    name: string;
    id: number;
    department?: {
      id: number;
      name: string;
      image: string | null;
    };
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
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("all");

  // Debug: Log the first voter to see the structure
  if (voters.length > 0) {
    console.log("VoterCards - First voter:", {
      id: voters[0].id,
      name: `${voters[0].firstName} ${voters[0].lastName}`,
      year: voters[0].year,
      department: voters[0].year?.department,
    });
  }

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

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Voters - Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .voter-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .voter-table th, .voter-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .voter-table th { background-color: #f2f2f2; font-weight: bold; }
            .voter-table tr:nth-child(even) { background-color: #f9f9f9; }
            .status-voted { background-color: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px; }
            .status-registered { background-color: #d1ecf1; color: #0c5460; padding: 2px 6px; border-radius: 3px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>All Voters Report</h1>
            <p>Total Voters: ${filteredVoters.length}</p>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
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
                <th>Credentials</th>
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
                        <span class="${voter.status === "VOTED" ? "status-voted" : "status-registered"}">
                          ${voter.status.toLowerCase()}
                        </span>
                      </td>
                      <td>${voter.election?.name || "Not assigned"}</td>
                      <td>${new Date(voter.createdAt).toLocaleDateString()}</td>
                      <td>${voter.credentialsSent ? "Sent" : "Pending"}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>This report contains ${filteredVoters.length} voters.</p>
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

  const handlePrintSelected = () => {
    if (selectedVoters.length === 0) {
      alert("Please select voters to print");
      return;
    }

    const selectedVoterData = filteredVoters.filter((voter) =>
      selectedVoters.includes(voter.id)
    );
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Selected Voters - Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .voter-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .voter-table th, .voter-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .voter-table th { background-color: #f2f2f2; font-weight: bold; }
            .voter-table tr:nth-child(even) { background-color: #f9f9f9; }
            .status-voted { background-color: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px; }
            .status-registered { background-color: #d1ecf1; color: #0c5460; padding: 2px 6px; border-radius: 3px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Selected Voters Report</h1>
            <p>Selected Voters: ${selectedVoterData.length}</p>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
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
                <th>Credentials</th>
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
                        <span class="${voter.status === "VOTED" ? "status-voted" : "status-registered"}">
                          ${voter.status.toLowerCase()}
                        </span>
                      </td>
                      <td>${voter.election?.name || "Not assigned"}</td>
                      <td>${new Date(voter.createdAt).toLocaleDateString()}</td>
                      <td>${voter.credentialsSent ? "Sent" : "Pending"}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>This report contains ${selectedVoterData.length} selected voters.</p>
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

  return (
    <div className="space-y-4">
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
              <Button variant="outline" size="sm" onClick={handleBulkEmail}>
                <SendIcon className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintSelected}>
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print Selected
              </Button>
            </>
          )}
        </div>
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

            // Debug specific voter
            if (voter.id === 59) {
              console.log("Jessica voter debug:", {
                id: voter.id,
                name: fullName,
                year: voter.year,
                departmentName: departmentName,
                rawDepartment: voter.year?.department,
              });
            }

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
                        src={
                          voter.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
                        }
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
                        ID: {voter.id}
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
                      {voter.election?.name || "Not assigned"}
                    </div>
                    <div className="text-sm line-clamp-1 flex items-center">
                      <School className="h-3 w-3 mr-1" />
                      <span className="font-medium mr-1">Year:</span>{" "}
                      {yearName || "Not assigned"}
                    </div>
                    <div className="text-sm line-clamp-1">
                      <span className="font-medium">Department:</span>{" "}
                      {departmentName || "Not assigned"}
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
