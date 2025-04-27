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

// Types for our data
interface Department {
  id: string;
  name: string;
}

interface Election {
  id: string;
  name: string;
}

export function CreateVoterForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingElections, setIsLoadingElections] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    departmentId: "",
    electionId: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // For displaying selected names
  const [selectedDeptName, setSelectedDeptName] = useState<string>("");
  const [selectedElectionName, setSelectedElectionName] = useState<string>("");

  // Fetch departments and elections when the component mounts or dialog opens
  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchElections();
      // Reset errors when dialog opens
      setErrors({});
    }
  }, [open]);

  // Update displayed names when selection or data changes
  useEffect(() => {
    if (formData.departmentId && departments.length > 0) {
      const dept = departments.find((d) => d.id === formData.departmentId);
      setSelectedDeptName(dept?.name || "");
    } else {
      setSelectedDeptName("");
    }

    if (formData.electionId && elections.length > 0) {
      const election = elections.find((e) => e.id === formData.electionId);
      setSelectedElectionName(election?.name || "");
    } else {
      setSelectedElectionName("");
    }
  }, [formData.departmentId, formData.electionId, departments, elections]);

  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const response = await fetch("/api/departments", {
        cache: "force-cache",
      });
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

  const fetchElections = async () => {
    setIsLoadingElections(true);
    try {
      const response = await fetch("/api/elections", {
        cache: "force-cache",
      });
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

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user makes a selection
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Update selected name immediately for better UX
    if (name === "departmentId") {
      const dept = departments.find((d) => d.id === value);
      if (dept) {
        setSelectedDeptName(dept.name);
      }
    } else if (name === "electionId") {
      const election = elections.find((e) => e.id === value);
      if (election) {
        setSelectedElectionName(election.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Check if all required fields are filled
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "departmentId",
      "electionId",
    ];

    let newErrors: { [key: string]: string } = {};
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

    try {
      const response = await fetch("/api/voters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description:
            "Voter has been successfully added. Temporary password: " +
            data.tempPassword,
          variant: "default",
        });
        setOpen(false);
        resetForm();

        // Refresh the page to show the new voter
        router.refresh();

        // Also invalidate any cached API requests
        try {
          await fetch("/api/revalidate?tag=voters", { method: "POST" });
        } catch (error) {
          console.error("Failed to revalidate data:", error);
        }
      } else {
        // Handle specific errors
        if (response.status === 409 || data.code === "P2002") {
          // Prisma unique constraint violation (P2002) - email already exists
          setErrors({ email: "This email is already registered" });
          toast({
            title: "Email Already Registered",
            description:
              "A voter with this email already exists in the system.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error || data.message || "Failed to add voter");
        }
      }
    } catch (error) {
      console.error("Error adding voter:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add voter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      departmentId: "",
      electionId: "",
    });
    setSelectedDeptName("");
    setSelectedElectionName("");
    setErrors({});
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Clear form and errors when closing the dialog
          resetForm();
        }
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="w-full md:w-auto">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Voter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Voter</DialogTitle>
            <DialogDescription>
              Fill in the voter's details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="col-span-3">
                <Label
                  htmlFor="firstName"
                  className={errors.firstName ? "text-red-500" : ""}
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`mt-1 ${errors.firstName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  required
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="col-span-3">
                <Label
                  htmlFor="lastName"
                  className={errors.lastName ? "text-red-500" : ""}
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`mt-1 ${errors.lastName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  required
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
              <div className="col-span-3">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div className="col-span-3">
                <Label
                  htmlFor="email"
                  className={errors.email ? "text-red-500" : ""}
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div className="col-span-3">
                <Label
                  htmlFor="departmentId"
                  className={errors.departmentId ? "text-red-500" : ""}
                >
                  Department
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("departmentId", value)
                  }
                  value={formData.departmentId}
                  disabled={isLoadingDepartments}
                >
                  <SelectTrigger
                    className={`mt-1 ${errors.departmentId ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    id="departmentId"
                  >
                    <SelectValue placeholder="Select department">
                      {selectedDeptName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        {isLoadingDepartments
                          ? "Loading departments..."
                          : "No departments available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.departmentId}
                  </p>
                )}
              </div>

              <div className="col-span-3">
                <Label
                  htmlFor="electionId"
                  className={errors.electionId ? "text-red-500" : ""}
                >
                  Election
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("electionId", value)
                  }
                  value={formData.electionId}
                  disabled={isLoadingElections}
                >
                  <SelectTrigger
                    className={`mt-1 ${errors.electionId ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    id="electionId"
                  >
                    <SelectValue placeholder="Select election">
                      {selectedElectionName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {elections.length > 0 ? (
                      elections.map((election) => (
                        <SelectItem key={election.id} value={election.id}>
                          {election.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        {isLoadingElections
                          ? "Loading elections..."
                          : "No elections available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.electionId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.electionId}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600"
              disabled={
                isSubmitting || isLoadingDepartments || isLoadingElections
              }
            >
              {isSubmitting ? "Adding..." : "Add Voter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
