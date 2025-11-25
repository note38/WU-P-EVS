"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building,
  ChevronRight,
  PrinterIcon,
  School,
  SendIcon,
  Users,
  GridIcon,
  ListIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import VoterCards from "./voter-card";
import { Voter as VoterCardType } from "./voter-card";
import VoterTable from "./voter-table";

// Reuse the Voter and VoterStatus types from VoterCards to avoid duplication
type Voter = VoterCardType & { voterId?: string };

// Define Year type
type Year = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  voterCount: number;
  departmentId: string;
};

// Define Department type
type Department = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  avatar: string;
  voterCount: number;
  years: Year[];
};

interface DepartmentCardProps {
  voters: Voter[];
  info?: any | null;
  departmentsData?: any[];
  onVoterUpdate?: () => void;
}

export default function DepartmentCard({
  voters,
  info,
  departmentsData,
  onVoterUpdate,
}: DepartmentCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [showYears, setShowYears] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card"); // New state for view mode
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768; // Mobile breakpoint
      setIsMobile(mobile);
    };

    // Initial check
    checkIsMobile();

    // Set default view mode based on device type
    setViewMode(window.innerWidth < 768 ? "table" : "card");

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);

    // Cleanup event listener
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  // Update view mode when mobile status changes
  useEffect(() => {
    setViewMode(isMobile ? "table" : "card");
  }, [isMobile]);

  const getFullName = (voter: Voter) => {
    return `${voter.firstName} ${voter.middleName} ${voter.lastName}`
      .trim()
      .replace(/\s+/g, " ");
  };

  // Group voters by department and year
  // Use the actual department data from the database
  const departmentMap = new Map<string, string[]>();

  voters.forEach((voter) => {
    if (!voter.year?.name || !voter.year?.department?.name) return; // Skip voters without year or department info

    const yearName = voter.year.name;
    const departmentName = voter.year.department.name;

    if (!departmentMap.has(departmentName)) {
      departmentMap.set(departmentName, []);
    }

    if (!departmentMap.get(departmentName)?.includes(yearName)) {
      departmentMap.get(departmentName)?.push(yearName);
    }
  });

  // Create department objects with vibrant colors
  const departmentColors = [
    "bg-blue-500 text-white",
    "bg-emerald-500 text-white",
    "bg-violet-500 text-white",
    "bg-amber-500 text-white",
    "bg-rose-500 text-white",
    "bg-cyan-500 text-white",
    "bg-indigo-500 text-white",
    "bg-orange-500 text-white",
    "bg-teal-500 text-white",
    "bg-pink-500 text-white",
  ];

  // Generate a consistent color based on name
  function getDepartmentColor(name: string, index: number): string {
    return departmentColors[index % departmentColors.length];
  }

  // Year level colors - softer shades
  const yearColors = [
    "bg-blue-100 text-blue-800",
    "bg-emerald-100 text-emerald-800",
    "bg-violet-100 text-violet-800",
    "bg-amber-100 text-amber-800",
    "bg-rose-100 text-rose-800",
    "bg-cyan-100 text-cyan-800",
    "bg-indigo-100 text-indigo-800",
    "bg-orange-100 text-orange-800",
    "bg-teal-100 text-teal-800",
    "bg-pink-100 text-pink-800",
  ];

  function getYearColor(name: string, index: number): string {
    return yearColors[index % yearColors.length];
  }

  // Helper function to generate avatar URL based on department name
  function generateAvatarURL(name: string, index: number): string {
    const colors = [
      "4e79a7",
      "f28e2c",
      "e15759",
      "76b7b2",
      "59a14f",
      "edc949",
      "af7aa1",
      "ff9da7",
      "9c755f",
      "bab0ab",
    ];
    const color = colors[index % colors.length];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff`;
  }

  // Create departments with updated colors and styles
  const departments: Department[] = Array.from(departmentMap.entries()).map(
    ([deptName, yearNames], index) => {
      const deptVoters = voters.filter((voter) => {
        if (!voter.year?.name || !voter.year?.department?.name) return false;
        return voter.year.department.name === deptName;
      });

      // Create year objects for this department
      const years = yearNames.map((yearName, yearIndex) => {
        // Filter voters by both year name AND department name to get accurate count
        const yearVoters = voters.filter(
          (voter) =>
            voter.year?.name === yearName &&
            voter.year?.department?.name === deptName
        );
        const yearId = yearName.toLowerCase().replace(/\s+/g, "-");

        return {
          id: yearId,
          name: yearName, // Use the actual year name
          description: `${yearName} students`,
          icon: <School className="h-4 w-4 mr-1" />,
          color: getYearColor(yearName, yearIndex),
          voterCount: yearVoters.length, // Now correctly filtered by department
          departmentId: deptName.toLowerCase().replace(/\s+/g, "-"),
        };
      });

      // Sort years naturally (Year 1, Year 2, etc.)
      years.sort((a, b) => {
        const aNum = parseInt(a.name.replace(/\D/g, "")) || 0;
        const bNum = parseInt(b.name.replace(/\D/g, "")) || 0;
        return aNum - bNum;
      });

      return {
        id: deptName.toLowerCase().replace(/\s+/g, "-"),
        name: deptName,
        description: `${deptName} department`,
        icon: <Building className="h-4 w-4 mr-1" />,
        color: getDepartmentColor(deptName, index),
        avatar: generateAvatarURL(deptName, index),
        voterCount: deptVoters.length,
        years,
      };
    }
  );

  // Sort departments alphabetically
  departments.sort((a, b) => a.name.localeCompare(b.name));

  // Filtered voters based on selections and search term
  const filteredVoters = voters.filter((voter) => {
    const fullName = getFullName(voter);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      fullName.toLowerCase().includes(searchLower) ||
      voter.email.toLowerCase().includes(searchLower) ||
      voter.voterId?.toLowerCase().includes(searchLower) ||
      false;

    if (!voter.year?.name || !voter.year?.department?.name) return false;

    const voterDeptId = voter.year.department.name
      .toLowerCase()
      .replace(/\s+/g, "-");

    const matchesDepartment =
      !selectedDepartment || voterDeptId === selectedDepartment;
    const matchesYear =
      !selectedYear ||
      voter.year.name.toLowerCase().replace(/\s+/g, "-") === selectedYear;

    return matchesSearch && matchesDepartment && matchesYear;
  });

  // Handle department selection
  const handleDepartmentClick = (deptId: string) => {
    if (selectedDepartment === deptId) {
      // If clicking the same department, close everything
      setSelectedDepartment(null);
      setSelectedYear(null);
      setShowYears(false);
    } else {
      // If clicking a different department, select it and show years
      setSelectedDepartment(deptId);
      setSelectedYear(null);
      setShowYears(true);
    }
  };

  // Handle year selection
  const handleYearClick = (yearId: string) => {
    setSelectedYear(yearId === selectedYear ? null : yearId);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedDepartment(null);
    setSelectedYear(null);
    setShowYears(false);
    setSearchTerm("");
  };

  // Get the selected department object
  const selectedDeptObj = departments.find((d) => d.id === selectedDepartment);

  // Get year object from selected year ID
  const selectedYearObj = selectedDeptObj?.years.find(
    (y) => y.id === selectedYear
  );

  // Handle voter update - trigger refresh
  const handleVoterUpdate = () => {
    // Notify parent to refresh voters data
    if (onVoterUpdate) {
      onVoterUpdate();
    }
    // Also trigger local refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* View Toggle Button - Always visible on mobile, visible on desktop when year is selected */}
      {(selectedYear || isMobile) && (
        <div className="flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <Button
              type="button"
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              className="rounded-r-none border-r"
              onClick={() => setViewMode("card")}
            >
              <GridIcon className="h-4 w-4 mr-2" />
              Card View
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("table")}
            >
              <ListIcon className="h-4 w-4 mr-2" />
              Table View
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
        {departments.map((dept) => (
          <Card
            key={dept.id}
            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden justify-between ${
              selectedDepartment === dept.id ? "ring-2 ring-primary" : ""
            } flex flex-col`}
            onClick={() => handleDepartmentClick(dept.id)}
          >
            <div className={`w-full h-2 ${dept.color.split(" ")[0]}`}></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={dept.avatar} alt={dept.name} />
                  <AvatarFallback className={dept.color}>
                    {dept.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {dept.description}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="h-6 w-8 rounded-lg flex items-center justify-center"
              >
                <Users className="h-3 w-3" />
                <span className="text-xs">{dept.voterCount}</span>
              </Badge>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <School className="h-4 w-4" />
                <span className="text-sm">
                  {dept.years.length} year{" "}
                  {dept.years.length === 1 ? "level" : "levels"}
                </span>
                <ChevronRight
                  className={`h-4 w-4 ml-auto transition-transform ${
                    selectedDepartment === dept.id && showYears
                      ? "rotate-90"
                      : ""
                  }`}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/50 bg-muted/10 px-6 py-2">
              <span className="text-xs text-muted-foreground">
                Click to explore
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {dept.years.length} {dept.years.length === 1 ? "year" : "years"}{" "}
                · {dept.voterCount} {dept.voterCount === 1 ? "voter" : "voters"}
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Display Years for Selected Department */}
      {selectedDepartment && showYears && (
        <div>
          <Card className="border-t-4 border-t-primary shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Year Levels in {selectedDeptObj?.name}
                  </CardTitle>
                  <CardDescription>
                    Select a year to view its voters
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-2">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedDeptObj?.voterCount} voters
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedDeptObj?.years.map((year, index) => (
                  <Card
                    key={year.id}
                    className={`cursor-pointer transition-all hover:shadow-md relative overflow-hidden ${
                      selectedYear === year.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleYearClick(year.id)}
                  >
                    <div
                      className={`w-full h-1 ${year.color.split(" ")[0]}`}
                    ></div>
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-full ${year.color}`}>
                            <School className="h-4 w-4" />
                          </div>
                          <CardTitle className="text-md">{year.name}</CardTitle>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          <Users className="h-3 w-3 mr-1" />
                          {year.voterCount}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Display Voters for Selected Year */}
      {selectedYear && (
        <div>
          <Card className="border-t-4 border-t-primary shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <School
                      className={`h-5 w-5 mr-2 p-1 rounded-full ${selectedYearObj?.color}`}
                    />
                    Voters in {selectedYearObj?.name} - {selectedDeptObj?.name}
                  </CardTitle>
                  <CardDescription>
                    Manage voters in this year level
                  </CardDescription>
                </div>
                <div className="flex gap-2"></div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredVoters.length > 0 ? (
                isMobile || viewMode === "table" ? (
                  <VoterTable
                    voters={filteredVoters}
                    info={info}
                    onVoterDelete={handleVoterUpdate}
                    onVoterUpdate={handleVoterUpdate}
                  />
                ) : (
                  <VoterCards
                    voters={filteredVoters}
                    info={info}
                    onVoterUpdate={handleVoterUpdate}
                    onVoterDelete={handleVoterUpdate}
                  />
                )
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No voters found</h3>
                  <p className="text-muted-foreground mt-2 mb-4">
                    No voters match your current filters or search query.
                  </p>
                  <Button variant="outline" onClick={clearSelections}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
