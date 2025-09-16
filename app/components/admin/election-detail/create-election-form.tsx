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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreateElectionFormProps {
  onElectionCreated?: () => void;
}

export function CreateElectionForm({
  onElectionCreated,
}: CreateElectionFormProps = {}) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    partyList: ["Independent"] as string[],
  });
  const [newParty, setNewParty] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      partyList: ["Independent"],
    });
    setNewParty("");
    setFormErrors({});
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && !isSubmitting) {
      // Reset form when dialog is closed (but not when submitting)
      resetForm();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Capitalize first letter for name and description fields
    let modifiedValue = value;
    if ((name === "name" || name === "description") && value.length > 0) {
      modifiedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }

    setFormData((prev) => ({ ...prev, [name]: modifiedValue }));

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleAddParty = () => {
    if (newParty.trim() !== "") {
      // Prevent adding "Independent" as it's already included
      if (newParty.trim().toLowerCase() === "independent") {
        toast({
          title: "Note",
          description: "Independent party is already included by default",
          variant: "default",
        });
        setNewParty("");
        return;
      }

      // Capitalize first letter of party name
      const capitalizedParty =
        newParty.trim().charAt(0).toUpperCase() + newParty.trim().slice(1);
      setFormData((prev) => ({
        ...prev,
        partyList: [...prev.partyList, capitalizedParty],
      }));
      setNewParty("");
    }
  };

  const handleRemoveParty = (index: number) => {
    // Prevent removing Independent party
    if (formData.partyList[index].toLowerCase() === "independent") {
      toast({
        title: "Note",
        description: "The Independent party cannot be removed",
        variant: "default",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      partyList: prev.partyList.filter((_, i) => i !== index),
    }));
  };

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split("T")[0];

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Election name is required";
    }

    if (!formData.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      errors.endDate = "End date is required";
    }

    // Validate dates
    if (formData.startDate && formData.endDate) {
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime || "00:00"}`
      );
      const endDateTime = new Date(
        `${formData.endDate}T${formData.endTime || "23:59"}`
      );

      if (isNaN(startDateTime.getTime())) {
        errors.startDate = "Invalid start date";
      }

      if (isNaN(endDateTime.getTime())) {
        errors.endDate = "Invalid end date";
      }

      if (
        !errors.startDate &&
        !errors.endDate &&
        endDateTime <= startDateTime
      ) {
        errors.endDate = "End date must be after start date";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format dates properly for the API in ISO format
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime || "00:00:00"}`
      );
      const endDateTime = new Date(
        `${formData.endDate}T${formData.endTime || "23:59:59"}`
      );

      const formattedData = {
        name: formData.name,
        description: formData.description || "", // Ensure description is never undefined
        startDate: startDateTime.toISOString(), // Send full ISO string
        endDate: endDateTime.toISOString(), // Send full ISO string
        partyList: formData.partyList, // Send party list array directly
      };

      console.log("Sending data to API:", JSON.stringify(formattedData));

      const response = await fetch("/api/elections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;

        try {
          // Only try to parse JSON if there's actually content
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            if (errorData && typeof errorData === "object" && errorData.error) {
              errorMessage = errorData.error;
            }
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
        }

        throw new Error(errorMessage);
      }

      // Only parse response as JSON if we know it's ok
      const responseData = await response.json();

      // Show success message
      toast({
        title: "Success",
        description: "Election has been created successfully",
        variant: "default",
      });

      // Close the dialog
      setOpen(false);

      // Reset form
      resetForm();

      // Trigger refetch if callback is provided
      if (onElectionCreated) {
        onElectionCreated();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission Error",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full md:w-auto">
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Election
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Election</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new election. Click save when
              you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="col-span-4">
                Election Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Presidential Election 2025"
                className={`col-span-4 ${formErrors.name ? "border-red-500" : ""}`}
                value={formData.name}
                onChange={handleChange}
                required
              />
              {formErrors.name && (
                <div className="col-span-4 text-red-500 text-sm mt-1">
                  {formErrors.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="col-span-4">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter election details and description"
                className="col-span-4"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="col-span-2">
                Start Date
              </Label>
              <Label htmlFor="startTime" className="col-span-2">
                Start Time
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                min={today}
                className={`col-span-2 ${formErrors.startDate ? "border-red-500" : ""}`}
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <Input
                id="startTime"
                name="startTime"
                type="time"
                className="col-span-2"
                value={formData.startTime}
                onChange={handleChange}
              />
              {formErrors.startDate && (
                <div className="col-span-4 text-red-500 text-sm mt-1">
                  {formErrors.startDate}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="col-span-2">
                End Date
              </Label>
              <Label htmlFor="endTime" className="col-span-2">
                End Time
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                min={formData.startDate || today}
                className={`col-span-2 ${formErrors.endDate ? "border-red-500" : ""}`}
                value={formData.endDate}
                onChange={handleChange}
                required
              />
              <Input
                id="endTime"
                name="endTime"
                type="time"
                className="col-span-2"
                value={formData.endTime}
                onChange={handleChange}
              />
              {formErrors.endDate && (
                <div className="col-span-4 text-red-500 text-sm mt-1">
                  {formErrors.endDate}
                </div>
              )}
            </div>

            {/* Party List Section */}
            <div className="grid grid-cols-4 items-start gap-4 mt-4">
              <Label className="col-span-4 font-medium text-lg">
                Party List
              </Label>
              <div className="col-span-4">
                <div className="max-h-40 overflow-y-auto mb-2 border rounded-md border-border">
                  <div className="p-2 space-y-2">
                    {formData.partyList.map((party, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className={`px-3 py-2 rounded flex-1 ${
                            party.toLowerCase() === "independent"
                              ? "bg-muted/70 text-muted-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {party}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParty(index)}
                          disabled={party.toLowerCase() === "independent"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add partylist"
                    value={newParty}
                    onChange={(e) => setNewParty(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddParty();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddParty}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Election"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
