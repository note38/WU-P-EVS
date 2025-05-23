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
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch available departments when dialog opens
  useEffect(() => {
    if (open) {
      fetchDepartments();
    } else {
      // Reset selections when dialog closes
      setSelectedDepartment("");
      setSelectedYear("");
      setYears([]);
    }
  }, [open]);

  // Fetch years when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchYearsByDepartment(parseInt(selectedDepartment));
      setSelectedYear(""); // Reset year selection when department changes
    } else {
      setYears([]);
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
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

  const fetchYearsByDepartment = async (departmentId: number) => {
    try {
      const response = await fetch(`/api/years/by-department/${departmentId}`);
      if (response.ok) {
        const data = await response.json();
        setYears(data);
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
                    years.length === 0 && selectedDepartment
                      ? "No years available"
                      : "Select year"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {years.length > 0 ? (
                  years.map((year) => (
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
