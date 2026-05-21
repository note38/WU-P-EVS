"use client";

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
import { Building, ChevronRight, School, Users } from "lucide-react";
import { useState, useEffect } from "react";
import VoterCards from "./voter-card";
import { Voter as VoterCardType } from "./voter-card";

type Voter = VoterCardType & { voterId?: string };

type Year = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  voterCount: number;
  departmentId: string;
};

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
  onVoterUpdate,
}: DepartmentCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [showYears, setShowYears] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const getFullName = (voter: Voter) =>
    `${voter.firstName} ${voter.middleName} ${voter.lastName}`
      .trim()
      .replace(/\s+/g, " ");

  // Build department → year mapping from voter data
  const departmentMap = new Map<string, string[]>();
  voters.forEach((voter) => {
    const departmentName =
      voter.year?.program?.department?.name || "Unassigned";
    const yearName = voter.year?.name || "No Year";
    if (!departmentMap.has(departmentName)) {
      departmentMap.set(departmentName, []);
    }
    if (
      yearName !== "No Year" &&
      !departmentMap.get(departmentName)?.includes(yearName)
    ) {
      departmentMap.get(departmentName)?.push(yearName);
    }
  });

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

  const departments: Department[] = Array.from(departmentMap.entries())
    .map(([deptName, yearNames], index) => {
      const deptVoters = voters.filter(
        (v) => (v.year?.program?.department?.name || "Unassigned") === deptName,
      );

      const years = yearNames
        .map((yearName, yearIndex) => {
          const yearVoters = voters.filter(
            (v) =>
              v.year?.name === yearName &&
              (v.year?.program?.department?.name || "Unassigned") === deptName,
          );
          return {
            id: yearName.toLowerCase().replace(/\s+/g, "-"),
            name: yearName,
            description: `${yearName} students`,
            icon: <School className="h-4 w-4 mr-1" />,
            color: yearColors[yearIndex % yearColors.length],
            voterCount: yearVoters.length,
            departmentId: deptName.toLowerCase().replace(/\s+/g, "-"),
          };
        })
        .sort((a, b) => {
          const aNum = parseInt(a.name.replace(/\D/g, "")) || 0;
          const bNum = parseInt(b.name.replace(/\D/g, "")) || 0;
          return aNum - bNum;
        });

      return {
        id: deptName.toLowerCase().replace(/\s+/g, "-"),
        name: deptName,
        description: `${deptName} department`,
        icon: <Building className="h-4 w-4 mr-1" />,
        color: departmentColors[index % departmentColors.length],
        avatar: "",
        voterCount: deptVoters.length,
        years,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filtered voters based on department/year selection
  const filteredVoters = voters.filter((voter) => {
    const voterDeptId = (voter.year?.program?.department?.name || "Unassigned")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const matchesDepartment =
      !selectedDepartment || voterDeptId === selectedDepartment;
    const matchesYear =
      !selectedYear ||
      (voter.year?.name || "No Year").toLowerCase().replace(/\s+/g, "-") ===
        selectedYear;
    return matchesDepartment && matchesYear;
  });

  const handleDepartmentClick = (deptId: string) => {
    if (selectedDepartment === deptId) {
      setSelectedDepartment(null);
      setSelectedYear(null);
      setShowYears(false);
    } else {
      setSelectedDepartment(deptId);
      setSelectedYear(null);
      setShowYears(true);
    }
  };

  const handleYearClick = (yearId: string) => {
    setSelectedYear(yearId === selectedYear ? null : yearId);
  };

  const clearSelections = () => {
    setSelectedDepartment(null);
    setSelectedYear(null);
    setShowYears(false);
    setSearchTerm("");
  };

  const selectedDeptObj = departments.find((d) => d.id === selectedDepartment);
  const selectedYearObj = selectedDeptObj?.years.find(
    (y) => y.id === selectedYear,
  );

  const handleVoterUpdate = () => {
    if (onVoterUpdate) onVoterUpdate();
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Department Cards */}
      {departments.map((dept) => (
        <Card
          key={dept.id}
          className="border-t-4 border-t-primary shadow-md cursor-pointer"
          onClick={() => handleDepartmentClick(dept.id)}
        >
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{dept.name}</CardTitle>
              <CardDescription>{dept.description}</CardDescription>
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
                {dept.years.length} year
                {dept.years.length === 1 ? " level" : " levels"}
              </span>
              <ChevronRight
                className={`h-4 w-4 ml-auto transition-transform ${
                  selectedDepartment === dept.id && showYears ? "rotate-90" : ""
                }`}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/50 bg-muted/10 px-6 py-2">
            <span className="text-xs text-muted-foreground">
              Click to explore
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {dept.years.length} {dept.years.length === 1 ? "year" : "years"} ·{" "}
              {dept.voterCount} {dept.voterCount === 1 ? "voter" : "voters"}
            </span>
          </CardFooter>
        </Card>
      ))}

      {/* Year Levels for Selected Department */}
      {selectedDepartment && showYears && (
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
              {selectedDeptObj?.years.map((year) => (
                <Card
                  key={year.id}
                  className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                    selectedYear === year.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleYearClick(year.id);
                  }}
                >
                  <div className={`w-full h-1 ${year.color.split(" ")[0]}`} />
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-full ${year.color}`}>
                          <School className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-md">{year.name}</CardTitle>
                      </div>
                      <Badge variant="outline">
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
      )}

      {/* Voters — always card view */}
      {(selectedYear || selectedDepartment) && (
        <Card className="border-t-4 border-t-primary shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <School
                    className={`h-5 w-5 mr-2 p-1 rounded-full ${
                      selectedYearObj?.color ||
                      selectedDeptObj?.years?.[0]?.color ||
                      "bg-gray-100 text-gray-800"
                    }`}
                  />
                  {selectedYearObj
                    ? `${selectedYearObj.name} — ${selectedDeptObj?.name}`
                    : `All voters in ${selectedDeptObj?.name}`}
                </CardTitle>
                <CardDescription>
                  {selectedYearObj
                    ? "Manage voters in this year level"
                    : "Manage voters in this department"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredVoters.length > 0 ? (
              <VoterCards
                voters={filteredVoters}
                info={info}
                onVoterUpdate={handleVoterUpdate}
                onVoterDelete={handleVoterUpdate}
              />
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No voters found</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                  No voters match your current selection.
                </p>
                <Button variant="outline" onClick={clearSelections}>
                  Clear selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
