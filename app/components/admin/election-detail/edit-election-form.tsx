"use client";

import type React from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EditElectionFormProps {
  election: {
    id: number;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    partyList?: string[];
    partylists?: Array<{ id: number; name: string }>;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditElectionForm({
  election,
  open,
  onOpenChange,
}: EditElectionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newParty, setNewParty] = useState("");

  // Parse the date and time from the combined string
  const parseDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toISOString().split("T")[0],
      time: date.toTimeString().split(" ")[0].substring(0, 5),
    };
  };

  const startDateTime = parseDateTime(election.startDate);
  const endDateTime = parseDateTime(election.endDate);

  // Handle both partyList and partylists formats from the API
  const getInitialPartyList = () => {
    if (election.partyList && election.partyList.length > 0) {
      return election.partyList;
    }
    if (election.partylists && election.partylists.length > 0) {
      return election.partylists.map((p) => p.name);
    }
    return [];
  };

  const [formData, setFormData] = useState({
    name: election.name,
    description: election.description || "",
    startDate: startDateTime.date,
    startTime: startDateTime.time,
    endDate: endDateTime.date,
    endTime: endDateTime.time,
    partyList: getInitialPartyList(),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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
      setFormData((prev) => ({
        ...prev,
        partyList: [...prev.partyList, newParty.trim()],
      }));
      setNewParty("");
    }
  };

  const handleRemoveParty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      partyList: prev.partyList.filter((_, i) => i !== index),
    }));
  };

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
      // Format dates properly for the API
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime || "00:00:00"}`
      );
      const endDateTime = new Date(
        `${formData.endDate}T${formData.endTime || "23:59:59"}`
      );

      const formattedData = {
        name: formData.name,
        description: formData.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        partyList: formData.partyList,
      };

      // Make API call to update the election
      const response = await fetch(`/api/elections/${election.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;

        try {
          const contentType = response.headers.get("content-type");

          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            if (errorData && typeof errorData === "object" && errorData.error) {
              errorMessage = errorData.error;
            }
          }
        } catch (e) {
          // If there's an error parsing JSON, use the status text we already have
          console.error("Error parsing response JSON:", e);
        }

        throw new Error(errorMessage);
      }

      // Show success message
      toast({
        title: "Success",
        description: "Election has been updated successfully",
        variant: "default",
      });

      // Close the dialog
      onOpenChange(false);

      // Refresh the page to show the updated election
      router.refresh();
    } catch (error) {
      console.error("Error updating election:", error);

      // Show an error toast
      toast({
        title: "Update Error",
        description:
          error instanceof Error && error.message
            ? error.message
            : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Election</DialogTitle>
            <DialogDescription>
              Make changes to the election details. Click save when you're done.
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
                required
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
                required
              />
              {formErrors.endDate && (
                <div className="col-span-4 text-red-500 text-sm mt-1">
                  {formErrors.endDate}
                </div>
              )}
            </div>

            {/* Party List Section with Scrollable Container */}
            <div className="grid grid-cols-4 items-start gap-4 mt-4">
              <Label className="col-span-4 font-medium text-lg">
                Party List
              </Label>
              <div className="col-span-4">
                <div className="max-h-40 overflow-y-auto mb-2 border rounded-md">
                  <div className="p-2 space-y-2">
                    {formData.partyList.length > 0 ? (
                      formData.partyList.map((party, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="bg-gray-100 px-3 py-2 rounded flex-1">
                            {party}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveParty(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm py-2 px-3">
                        No parties added yet.
                      </div>
                    )}
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
