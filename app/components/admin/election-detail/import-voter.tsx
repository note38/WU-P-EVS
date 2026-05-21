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
  programId?: number;
}

interface Department {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
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
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
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
      setSelectedProgram("");
      setSelectedYear("");
      setPrograms([]);
      setYears([]);
    }
  }, [open]);

  // Fetch programs when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchProgramsByDepartment(parseInt(selectedDepartment));
      setSelectedProgram(""); // Reset program selection
      setSelectedYear(""); // Reset year selection
      setYears([]);
    } else {
      setPrograms([]);
      setYears([]);
    }
  }, [selectedDepartment]);

  // Fetch years when program changes
  useEffect(() => {
    if (selectedProgram) {
      fetchYearsByProgram(parseInt(selectedProgram));
      setSelectedYear(""); // Reset year selection when program changes
    } else {
      setYears([]);
    }
  }, [selectedProgram]);

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

  const fetchProgramsByDepartment = async (departmentId: number) => {
    try {
      const response = await fetch(
        `/api/programs/by-department/${departmentId}`
      );
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive",
      });
    }
  };

  const fetchYearsByProgram = async (programId: number) => {
    try {
      const response = await fetch(`/api/years/by-program/${programId}`);
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
    if (!selectedDepartment || !selectedProgram || !selectedYear) {
      toast({
        title: "Error",
        description: "Please select department, program, and year",
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
            programId: parseInt(selectedProgram),
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
          <DialogTitle>Import Voters by Department, Program and Year</DialogTitle>
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

          {/* Program Selection - Only enabled after selecting department */}
          <div className="grid gap-2">
            <Label htmlFor="program">Program</Label>
            <Select
              value={selectedProgram}
              onValueChange={setSelectedProgram}
              disabled={!selectedDepartment}
            >
              <SelectTrigger id="program">
                <SelectValue
                  placeholder={
                    programs.length === 0 && selectedDepartment
                      ? "No programs available"
                      : "Select program"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {programs.length > 0 ? (
                  programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.name}
                    </SelectItem>
                  ))
                ) : selectedDepartment ? (
                  <SelectItem value="none" disabled>
                    No programs available for this department
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selection - Only enabled after selecting program */}
          <div className="grid gap-2">
            <Label htmlFor="year">Year</Label>
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
              disabled={!selectedProgram}
            >
              <SelectTrigger id="year">
                <SelectValue
                  placeholder={
                    years.length === 0 && selectedProgram
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
                ) : selectedProgram ? (
                  <SelectItem value="none" disabled>
                    No years available for this program
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="mt-2"
            onClick={handleImport}
            disabled={
              loading ||
              !selectedDepartment ||
              !selectedProgram ||
              !selectedYear
            }
          >
            {loading ? "Importing..." : "Import Selected Voters"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
