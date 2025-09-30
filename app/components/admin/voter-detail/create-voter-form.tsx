"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

interface CreateVoterFormProps {
  onVoterCreated?: () => void;
}

export function CreateVoterForm({ onVoterCreated }: CreateVoterFormProps = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
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

  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchElections();
      setErrors({});
    } else {
      // Reset selections when dialog closes
      setSelectedDepartmentId("");
      setFormData({
        firstName: "",
        lastName: "",
        middleName: "",
        email: "",
        yearId: "",
        electionId: "",
      });
      setYears([]);
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchYearsByDepartment(parseInt(selectedDepartmentId));
      setFormData((prev) => ({ ...prev, yearId: "" })); // Reset year selection when department changes
    } else {
      setYears([]);
      setFormData((prev) => ({ ...prev, yearId: "" }));
    }
  }, [selectedDepartmentId]);

  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const response = await fetch("/api/admin/departments");
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
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const fetchYearsByDepartment = async (departmentId: number) => {
    setIsLoadingYears(true);
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
    } finally {
      setIsLoadingYears(false);
    }
  };

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
      middleName: formData.middleName || null,
      electionId: formData.electionId || null,
      yearId: formData.yearId,
    };

    try {
      console.log("Submitting data:", submissionData); // Debug log
      const response = await fetch("/api/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      console.log("Response status:", response.status); // Debug log
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      ); // Debug log

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, get text content
        const textContent = await response.text();
        console.log("Raw response text:", textContent); // Debug log
        data = { error: "Invalid response format", rawResponse: textContent };
      }

      console.log("API Response:", response.status, data); // Debug log

      if (response.ok && data.success) {
        // With Clerk integration, voters will authenticate through Clerk
        // So we don't need to show temporary passwords
        const message = data.voter?.credentialsSent
          ? `Voter created successfully. Login credentials have been sent to ${data.voter.email}.`
          : `Voter created successfully. They will authenticate through Clerk.`;

        toast({
          title: "Success",
          description: message,
        });
        setOpen(false);

        // Trigger refetch if callback is provided
        if (onVoterCreated) {
          onVoterCreated();
        }

        // Form will be reset when dialog closes due to useEffect
      } else {
        if (response.status === 409) {
          setErrors({ email: "Email already registered" });
          toast({
            title: "Registration Error",
            description: "This email is already in use",
            variant: "destructive",
          });
        } else {
          // Log more detailed error information
          console.error("API Error Response:", {
            status: response.status,
            statusText: response.statusText,
            data: data,
            url: "/api/voters",
            method: "POST",
          });

          // Show more descriptive error message to user
          const errorMessage =
            data?.error || data?.message || "Failed to add voter";
          const errorDetails = data?.details ? `: ${data.details}` : "";

          toast({
            title: "Error",
            description: `${errorMessage}${errorDetails}`,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Submission Error:", error);
      toast({
        title: "Network Error",
        description:
          error.message ||
          "Failed to submit the form. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Voter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Voter</DialogTitle>
            <DialogDescription>
              Add a new voter to the system. Voters will authenticate through
              Clerk.
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
                {errors.electionId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.electionId}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Voter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
