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
import { useEffect, useState } from "react";

interface Department {
  id: number;
  name: string;
}

interface Year {
  id: number;
  name: string;
  departmentId?: number; // Made optional since API might not return this
}

interface AddVoterFormProps {
  electionId: number;
  onVoterAdded: (newVoter: any) => void;
}

export function AddVoterForm({ electionId, onVoterAdded }: AddVoterFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingYears, setIsLoadingYears] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    yearId: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      fetchDepartments();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const requiredFields = ["firstName", "lastName", "email", "yearId"];
    const newErrors: { [key: string]: string } = {};

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] =
          `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare data with the election ID and other required fields
    const submissionData = {
      ...formData,
      electionId: electionId.toString(),
      middleName: formData.middleName || null,
    };

    try {
      console.log("Submitting data:", submissionData); // Debug log
      const response = await fetch("/api/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();
      console.log("API Response:", response.status, data); // Debug log

      if (response.ok) {
        // With Clerk integration, voters will authenticate through Clerk
        // So we don't need to show temporary passwords
        const message = data.credentialsSent
          ? `Voter added to election. Login credentials have been sent to ${data.voter.email}.`
          : `Voter added to election. They will authenticate through Clerk.`;

        toast({
          title: "Success",
          description: message,
        });
        setOpen(false);
        onVoterAdded(data.voter || data);
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
          console.error("API Error Response:", data); // More detailed error logging
          toast({
            title: "Error",
            description: data.error || "Failed to add voter",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast({
        title: "Error",
        description: "Failed to submit the form",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Voter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Voter to Election</DialogTitle>
            <DialogDescription>
              Register a new voter directly to this election. Voters will
              authenticate through Clerk.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="firstName">First Name</Label>
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
                <Label htmlFor="email">Email</Label>
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
                <Label>Department</Label>
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
                <Label>Year</Label>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Voter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
