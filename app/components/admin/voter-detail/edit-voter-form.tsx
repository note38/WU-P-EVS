"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Voter } from "./voter-card";

interface Department {
  id: number;
  name: string;
}

interface Election {
  id: number;
  name: string;
}

interface Year {
  id: number;
  name: string;
  departmentId?: number;
}

interface EditVoterFormProps {
  voter: Voter;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoterUpdated: () => void;
}

export function EditVoterForm({
  voter,
  open,
  onOpenChange,
  onVoterUpdated,
}: EditVoterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingYears, setIsLoadingYears] = useState(false);
  const [isLoadingElections, setIsLoadingElections] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    yearId: "",
    electionId: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Handle dialog close
  const handleClose = () => {
    // Reset all state when closing
    setFormData({
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      yearId: "",
      electionId: "",
    });
    setSelectedDepartmentId("");
    setYears([]);
    setErrors({});
    onOpenChange(false);
  };

  // Initialize form with voter data
  useEffect(() => {
    if (open && voter) {
      setFormData({
        firstName: voter.firstName || "",
        lastName: voter.lastName || "",
        middleName: voter.middleName || "",
        email: voter.email || "",
        yearId: voter.year?.id?.toString() || "",
        electionId: voter.election?.id?.toString() || "",
      });

      // Set selected department based on voter's year
      if (voter.year?.department?.id) {
        const deptId = voter.year.department.id.toString();
        setSelectedDepartmentId(deptId);
        fetchYearsByDepartment(voter.year.department.id);
      } else {
        // If no department, reset the selection
        setSelectedDepartmentId("");
        setYears([]);
      }

      fetchDepartments();
      fetchElections();
      setErrors({});
    } else if (!open) {
      // Reset form when dialog closes
      setFormData({
        firstName: "",
        lastName: "",
        middleName: "",
        email: "",
        yearId: "",
        electionId: "",
      });
      setSelectedDepartmentId("");
      setYears([]);
      setErrors({});
    }
  }, [open, voter]);

  // Fetch departments
  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const response = await fetch("/api/admin/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        console.error("Failed to fetch departments:", response.status);
        toast({
          title: "Error",
          description: "Failed to load departments",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // Fetch years by department
  const fetchYearsByDepartment = async (departmentId: number) => {
    setIsLoadingYears(true);
    try {
      const response = await fetch(`/api/years/by-department/${departmentId}`);
      if (response.ok) {
        const data = await response.json();
        setYears(data);
      } else {
        console.error("Failed to fetch years:", response.status);
        toast({
          title: "Error",
          description: "Failed to load years",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching years:", error);
      toast({
        title: "Error",
        description: "Failed to load years",
        variant: "destructive",
      });
    } finally {
      setIsLoadingYears(false);
    }
  };

  // Fetch elections
  const fetchElections = async () => {
    setIsLoadingElections(true);
    try {
      const response = await fetch("/api/elections");
      if (response.ok) {
        const data = await response.json();
        // Filter for active elections
        const activeElections = data.filter(
          (election: any) => election.status === "ACTIVE"
        );
        setElections(activeElections);
      } else {
        console.error("Failed to fetch elections:", response.status);
        toast({
          title: "Error",
          description: "Failed to load elections",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching elections:", error);
      toast({
        title: "Error",
        description: "Failed to load elections",
        variant: "destructive",
      });
    } finally {
      setIsLoadingElections(false);
    }
  };

  // Handle department change
  useEffect(() => {
    if (selectedDepartmentId) {
      fetchYearsByDepartment(parseInt(selectedDepartmentId));
      setFormData((prev) => ({ ...prev, yearId: "" })); // Reset year selection when department changes
    } else {
      setYears([]);
      setFormData((prev) => ({ ...prev, yearId: "" }));
    }
  }, [selectedDepartmentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const requiredFields = ["firstName", "lastName", "email", "yearId"];
    const newErrors: { [key: string]: string } = {};

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] =
          `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Add email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare data for submission
    const submissionData = {
      ...formData,
      middleName: formData.middleName || "",
      electionId: formData.electionId || null,
      yearId: formData.yearId,
    };

    try {
      const response = await fetch(`/api/voters/${voter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Voter updated successfully.",
        });
        handleClose();
        onVoterUpdated();
      } else {
        if (response.status === 409) {
          setErrors({ email: "Email already registered to another voter" });
          toast({
            title: "Update Error",
            description: "This email is already in use by another voter",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to update voter",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast({
        title: "Error",
        description: "Failed to update the voter",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Voter</DialogTitle>
            <DialogDescription>
              Update voter information. Required fields are marked with an
              asterisk (*).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="middleName">Middle Name (Optional)</Label>
                <Input
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label>Department *</Label>
                <Select
                  value={selectedDepartmentId}
                  onValueChange={setSelectedDepartmentId}
                  disabled={isLoadingDepartments}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingDepartments
                          ? "Loading departments..."
                          : departments.length === 0
                            ? "No departments available"
                            : "Select department"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : !isLoadingDepartments ? (
                      <SelectItem value="none" disabled>
                        No departments available
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Year *</Label>
                <Select
                  value={formData.yearId}
                  onValueChange={(value) => handleSelectChange("yearId", value)}
                  disabled={!selectedDepartmentId || isLoadingYears}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedDepartmentId
                          ? "Select department first"
                          : isLoadingYears
                            ? "Loading years..."
                            : years.length === 0 && selectedDepartmentId
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
                    ) : selectedDepartmentId && !isLoadingYears ? (
                      <SelectItem value="none" disabled>
                        No years available for this department
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
                {errors.yearId && (
                  <p className="text-red-500 text-sm mt-1">{errors.yearId}</p>
                )}
              </div>

              <div>
                <Label>Election (Optional)</Label>
                <Select
                  value={formData.electionId}
                  onValueChange={(value) =>
                    handleSelectChange("electionId", value)
                  }
                  disabled={isLoadingElections}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingElections
                          ? "Loading elections..."
                          : elections.length === 0
                            ? "No active elections"
                            : "Select election"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {elections.length > 0 ? (
                      elections.map((election) => (
                        <SelectItem
                          key={election.id}
                          value={election.id.toString()}
                        >
                          {election.name}
                        </SelectItem>
                      ))
                    ) : !isLoadingElections ? (
                      <SelectItem value="none" disabled>
                        No active elections available
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Voter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
