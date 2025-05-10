"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Department {
  id: string;
  name: string;
}

interface Election {
  id: string;
  name: string;
}

interface Year {
  id: string;
  name: string;
  departmentId: string;
}

export function CreateVoterForm() {
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
    }
  }, [open]);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchYears(selectedDepartmentId);
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
      console.error("Failed to fetch departments:", error);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const fetchYears = async (departmentId: string) => {
    setIsLoadingYears(true);
    try {
      const response = await fetch(`/api/years?departmentId=${departmentId}`);
      if (response.ok) {
        const data = await response.json();
        setYears(data);
      }
    } catch (error) {
      console.error("Failed to fetch years:", error);
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
        setElections(data);
      }
    } catch (error) {
      console.error("Failed to fetch elections:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "yearId",
      // Removed "electionId" from required fields
    ];
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

    // Prepare data - if electionId is empty, set it to null for the API
    const submissionData = {
      ...formData,
      electionId: formData.electionId || null,
    };

    try {
      const response = await fetch("/api/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Voter added. Temporary password: ${data.tempPassword}`,
        });
        setOpen(false);
        router.refresh();
        setFormData({
          firstName: "",
          lastName: "",
          middleName: "",
          email: "",
          yearId: "",
          electionId: "",
        });
        setSelectedDepartmentId("");
      } else {
        if (response.status === 409) {
          setErrors({ email: "Email already registered" });
          toast({
            title: "Registration Error",
            description: "This email is already in use",
            variant: "destructive",
          });
        } else {
          // Display specific error message from the API if available
          console.error("API Error:", data.error);
          toast({
            title: "API Error",
            description: data.error || "Failed to add voter",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add voter",
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
            <DialogTitle>Add Voter</DialogTitle>
            <DialogDescription>
              Register a new voter with their academic year and optional
              election.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
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
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
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
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                    {years.length === 0 && (
                      <SelectItem value="none" disabled>
                        {isLoadingYears
                          ? "Loading years..."
                          : "No years available"}
                      </SelectItem>
                    )}
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
                    <SelectValue placeholder="Select election (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {elections.map((election) => (
                      <SelectItem key={election.id} value={election.id}>
                        {election.name}
                      </SelectItem>
                    ))}
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
            <Button variant="outline" onClick={() => setOpen(false)}>
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
