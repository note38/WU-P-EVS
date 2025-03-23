"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dialog";

interface EditElectionFormProps {
  election: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
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

  const [formData, setFormData] = useState({
    name: election.name,
    startDate: startDateTime.date,
    startTime: startDateTime.time,
    endDate: endDateTime.date,
    endTime: endDateTime.time,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updated election data:", formData);
    // Here you would typically send the data to your backend
    onOpenChange(false);
    // Redirect or update UI as needed
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
                className="col-span-4"
                value={formData.name}
                onChange={handleChange}
                required
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
                className="col-span-2"
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
                className="col-span-2"
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
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
