"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";

// Define types for the components
interface Department {
  id: number;
  name: string;
}

interface RemoveByDepartmentDialogProps {
  electionId: number;
  onRemoveSuccess: () => void;
}

export function RemoveByDepartmentDialog({
  electionId,
  onRemoveSuccess,
}: RemoveByDepartmentDialogProps) {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch available departments when dialog opens
  useEffect(() => {
    if (open) {
      fetchDepartments();
    } else {
      // Reset selections when dialog closes
      setSelectedDepartment("");
    }
  }, [open]);

  const fetchDepartments = async () => {
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
    }
  };

  const handleRemove = async () => {
    if (!selectedDepartment) {
      toast({
        title: "Error",
        description: "Please select a department",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        departmentId: parseInt(selectedDepartment),
      };

      const response = await fetch(
        `/api/elections/${electionId}/voters/remove-by-department`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        setOpen(false);
        if (onRemoveSuccess) onRemoveSuccess();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to remove voters by department",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50">
          <TrashIcon className="h-4 w-4 mr-2" />
          Remove by Department
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Voters by Department</DialogTitle>
          <DialogDescription>
            This action will remove all voters from the selected department from this election. Voters who have already cast their votes cannot be removed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem
                    key={department.id}
                    value={department.id.toString()}
                  >
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="mt-2 bg-red-600 hover:bg-red-700"
            onClick={handleRemove}
            disabled={
              loading ||
              !selectedDepartment
            }
          >
            {loading ? "Removing..." : "Remove Voters"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
