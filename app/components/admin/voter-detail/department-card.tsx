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
} from "lucide-react";
import { useState } from "react";
import VoterCards from "./voter-card";

// Define VoterStatus enum since we don't have @prisma/client
enum VoterStatus {
  REGISTERED = "REGISTERED",
  VOTED = "VOTED",
}

type Voter = {
  id: number;
  voterId?: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  status: VoterStatus;
  avatar: string;
  credentialsSent: boolean;
  createdAt: Date;
  election: {
    name: string;
    id: number;
  };
  year: {
    name: string;
    id: number;
  };
  info?: any;
};

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
}

export default function DepartmentCard({
  voters,
  info,
  departmentsData,
}: DepartmentCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [showYears, setShowYears] = useState(false);

  const getFullName = (voter: Voter) => {
    return `${voter.firstName} ${voter.middleName} ${voter.lastName}`
      .trim()
      .replace(/\s+/g, " ");
  };

  // Group voters by department and year
  // This assumes that year.name follows a pattern like "Year 1 - Computer Science"
  // We need to extract the department name from the year name
  const departmentMap = new Map<string, string[]>();

  voters.forEach((voter) => {
    const yearName = voter.year.name;
    const parts = yearName.split(" - ");

    if (parts.length > 1) {
      const departmentName = parts[1];
      const yearOnly = parts[0];

      if (!departmentMap.has(departmentName)) {
        departmentMap.set(departmentName, []);
      }

      if (!departmentMap.get(departmentName)?.includes(yearName)) {
        departmentMap.get(departmentName)?.push(yearName);
      }
    } else {
      // If there's no department in the name, use "General" as the department
      if (!departmentMap.has("General")) {
        departmentMap.set("General", []);
      }

      if (!departmentMap.get("General")?.includes(yearName)) {
        departmentMap.get("General")?.push(yearName);
      }
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
        const parts = voter.year.name.split(" - ");
        return parts.length > 1
          ? parts[1] === deptName
          : deptName === "General";
      });

      // Create year objects for this department
      const years = yearNames.map((yearName, yearIndex) => {
        const yearVoters = voters.filter(
          (voter) => voter.year.name === yearName
        );
        const yearId = yearName.toLowerCase().replace(/\s+/g, "-");

        return {
          id: yearId,
          name: yearName.split(" - ")[0] || yearName, // Extract just the year part
          description: `${yearName} students`,
          icon: <School className="h-4 w-4 mr-1" />,
          color: getYearColor(yearName, yearIndex),
          voterCount: yearVoters.length,
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

    const parts = voter.year.name.split(" - ");
    const voterDeptId =
      parts.length > 1
        ? parts[1].toLowerCase().replace(/\s+/g, "-")
        : "general";

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
      // If clicking the same department, toggle years view
      setShowYears(!showYears);
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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 pt-2">
        {departments.map((dept) => (
          <Card
            key={dept.id}
            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${
              selectedDepartment === dept.id ? "ring-2 ring-primary" : ""
            } flex flex-col`}
            onClick={() => handleDepartmentClick(dept.id)}
          >
            <div className={`w-full h-2 ${dept.color.split(" ")[0]}`}></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={dept.avatar} alt={dept.name} />
                  <AvatarFallback className={dept.color}>
                    {dept.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                  <CardDescription>{dept.description}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                {dept.voterCount}
              </Badge>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <School className="h-4 w-4 mr-1" />
                  <span className="text-sm text-muted-foreground">
                    {dept.years.length} year{" "}
                    {dept.years.length === 1 ? "level" : "levels"}
                  </span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    selectedDepartment === dept.id && showYears
                      ? "rotate-90"
                      : ""
                  }`}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 pt-2 pb-3 px-6 flex justify-between ">
              <span className="text-xs text-muted-foreground">
                Click to explore
              </span>
              <span className="text-xs text-muted-foreground">
                {dept.years.length} {dept.years.length === 1 ? "year" : "years"}{" "}
                · {dept.voterCount} {dept.voterCount === 1 ? "voter" : "voters"}
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Display Years for Selected Department */}
      {selectedDepartment && showYears && (
        <div className="mt-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        <div className="mt-6">
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <SendIcon className="mr-2 h-4 w-4" />
                    Email All
                  </Button>
                  <Button variant="outline" size="sm">
                    <PrinterIcon className="mr-2 h-4 w-4" />
                    Print List
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredVoters.length > 0 ? (
                <VoterCards voters={filteredVoters} info={info} />
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
