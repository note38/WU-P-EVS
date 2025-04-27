"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function CreateElectionForm() {
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
    partyList: [] as string[],
  });
  const [newParty, setNewParty] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
      // Format dates properly for the API in ISO format
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime || "00:00:00"}`
      );
      const endDateTime = new Date(
        `${formData.endDate}T${formData.endTime || "23:59:59"}`
      );

      const formattedData = {
        name: formData.name,
        description: formData.description,
        startDate: startDateTime.toISOString().split("T")[0], // YYYY-MM-DD format
        startTime: formData.startTime || "00:00:00",
        endDate: endDateTime.toISOString().split("T")[0], // YYYY-MM-DD format
        endTime: formData.endTime || "23:59:59",
        partyList: formData.partyList,
      };

      console.log("Submitting formatted data:", formattedData);

      const response = await fetch("/api/elections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // Try to get the response text first
      const responseText = await response.text();
      console.log("Response text:", responseText);

      let data;
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          console.log("Parsed response data:", data);
        } catch (parseError) {
          console.error("Error parsing response as JSON:", parseError);
          // Not valid JSON
        }
      }

      if (!response.ok) {
        // Create a detailed error message
        let errorMessage;
        if (data && typeof data === "object" && "error" in data) {
          errorMessage = data.error;
        } else if (responseText) {
          errorMessage = `Server error: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}`;
        } else {
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }

        console.error("Error details:", {
          status: response.status,
          errorMessage,
        });
        throw new Error(errorMessage);
      }

      // Show success message
      toast({
        title: "Success",
        description: "Election has been created successfully",
        variant: "default",
      });

      // Close the dialog and refresh the page
      setOpen(false);
      router.refresh();

      // Reset form
      setFormData({
        name: "",
        description: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        partyList: [],
      });
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
    <Dialog open={open} onOpenChange={setOpen}>
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
