"use client";

import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/use-toast";
import { UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";

// Define types for the components
interface Year {
  id: number;
  name: string;
  departmentId?: number; // Made optional since API might not return this
}

interface Department {
  id: number;
  name: string;
}

// New interface for year-department relationship
interface YearDepartmentRelation {
  yearId: number;
  departmentId: number;
}

interface ImportVotersDialogProps {
  electionId: number;
  onImportSuccess: () => void;
}

export function ImportVotersDialog({
  electionId,
  onImportSuccess,
}: ImportVotersDialogProps) {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allYears, setAllYears] = useState<Year[]>([]);
  const [filteredYears, setFilteredYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [yearDepartmentRelations, setYearDepartmentRelations] = useState<
    YearDepartmentRelation[]
  >([]);

  // Fetch available departments and years when dialog opens
  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchYears();
      // For debugging purposes, let's fetch and log year-department relations
      fetchYearDepartmentRelations();
    } else {
      // Reset selections when dialog closes
      setSelectedDepartment("");
      setSelectedYear("");
      setFilteredYears([]);
    }
  }, [open]);

  // Filter years when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const departmentId = parseInt(selectedDepartment);

      // Get the yearIds related to this department
      const yearIds = yearDepartmentRelations
        .filter((relation) => relation.departmentId === departmentId)
        .map((relation) => relation.yearId);

      // Filter years based on these yearIds
      const yearsInDepartment = allYears.filter((year) =>
        yearIds.includes(year.id)
      );

      setFilteredYears(yearsInDepartment);

      // Add debug logs
      console.log("Selected department:", departmentId);
      console.log("Year IDs for department:", yearIds);
      console.log("Filtered years:", yearsInDepartment);

      setSelectedYear(""); // Reset year selection when department changes
    } else {
      setFilteredYears([]);
    }
  }, [selectedDepartment, allYears, yearDepartmentRelations]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
        console.log("Fetched departments:", data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      });
    }
  };

  const fetchYears = async () => {
    try {
      const response = await fetch("/api/years");
      if (response.ok) {
        const data = await response.json();
        setAllYears(data);
        console.log("Fetched years:", data);
      }
    } catch (error) {
      console.error("Error fetching years:", error);
      toast({
        title: "Error",
        description: "Failed to load years",
        variant: "destructive",
      });
    }
  };

  // New function to fetch the relationships between years and departments
  const fetchYearDepartmentRelations = async () => {
    try {
      // You'll need to create this API endpoint if it doesn't exist yet
      const response = await fetch("/api/year-department-relations");
      if (response.ok) {
        const data = await response.json();
        setYearDepartmentRelations(data);
        console.log("Fetched year-department relations:", data);
      } else {
        // If the API doesn't exist, we'll use a fallback approach
        // For now, we'll assume all years are available for all departments
        console.log(
          "Year-department relations API not available, using fallback"
        );
        const fallbackRelations: YearDepartmentRelation[] = [];

        // This is a temporary workaround until you create the proper API
        setTimeout(() => {
          const departments = Array.from(
            document.querySelectorAll("#department option")
          )
            .map((option) => parseInt((option as HTMLOptionElement).value))
            .filter((id) => !isNaN(id));

          const years = Array.from(document.querySelectorAll("#year option"))
            .map((option) => parseInt((option as HTMLOptionElement).value))
            .filter((id) => !isNaN(id));

          departments.forEach((deptId) => {
            years.forEach((yearId) => {
              fallbackRelations.push({
                departmentId: deptId,
                yearId: yearId,
              });
            });
          });

          setYearDepartmentRelations(fallbackRelations);
        }, 1000);
      }
    } catch (error) {
      console.error("Error fetching year-department relations:", error);

      // Fallback: Show all years for all departments
      console.log("Using fallback for year-department relations due to error");
      const fallbackRelations: YearDepartmentRelation[] = [];

      // Generate relations connecting all departments with all years
      departments.forEach((dept) => {
        allYears.forEach((year) => {
          fallbackRelations.push({
            departmentId: dept.id,
            yearId: year.id,
          });
        });
      });

      setYearDepartmentRelations(fallbackRelations);
    }
  };

  const handleImport = async () => {
    if (!selectedDepartment || !selectedYear) {
      toast({
        title: "Error",
        description: "Please select both department and year",
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
            yearId: parseInt(selectedYear),
            departmentId: parseInt(selectedDepartment),
            allDepartments: false,
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
          <DialogTitle>Import Voters by Department and Year</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Department Selection */}
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem
                    key={department.id}
                    value={department.id.toString()}
                  >
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selection - Only enabled after selecting department */}
          <div className="grid gap-2">
            <Label htmlFor="year">Year</Label>
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
              disabled={!selectedDepartment}
            >
              <SelectTrigger id="year">
                <SelectValue
                  placeholder={
                    filteredYears.length === 0 && selectedDepartment
                      ? "No years available"
                      : "Select year"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredYears.length > 0 ? (
                  filteredYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name}
                    </SelectItem>
                  ))
                ) : selectedDepartment ? (
                  <SelectItem value="none" disabled>
                    No years available for this department
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="mt-2"
            onClick={handleImport}
            disabled={loading || !selectedDepartment || !selectedYear}
          >
            {loading ? "Importing..." : "Import Selected Voters"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
