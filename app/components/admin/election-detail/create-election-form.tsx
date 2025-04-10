"use client";

import type React from "react";

import { useState } from "react";
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
import { PlusIcon, X } from "lucide-react";

export function CreateElectionForm() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    partyList: [] as string[],
  });
  const [newParty, setNewParty] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Election data:", formData);
    // Here you would typically send the data to your backend
    setOpen(false);
    // Reset form
    setFormData({
      name: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      partyList: [],
    });
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
                placeholder="Presidential Election 2023"
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
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              Create Election
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
