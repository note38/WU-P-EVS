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
import { PlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateVoterForm() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    departmentId: "",
    electionId: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Voter data:", formData);
    // Here you would typically send the data to your backend
    setOpen(false);
    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      departmentId: "",
      electionId: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                  required
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="departmentId">Department</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("departmentId", value)
                  }
                  value={formData.departmentId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Computer Science</SelectItem>
                    <SelectItem value="2">Engineering</SelectItem>
                    <SelectItem value="3">Business</SelectItem>
                    {/* Ideally, these would be populated from the database */}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label htmlFor="electionId">Election</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("electionId", value)
                  }
                  value={formData.electionId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select election" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Student Council 2023</SelectItem>
                    <SelectItem value="2">Faculty Senate 2023</SelectItem>
                    {/* Ideally, these would be populated from the database */}
                  </SelectContent>
                </Select>
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
              Add Voter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
