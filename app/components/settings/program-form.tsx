"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Types
type Department = {
  id: number;
  name: string;
};

type Program = {
  id: number;
  name: string;
  departmentId: number;
  department: Department;
};

// Form schema
const programFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Program name must be at least 2 characters." }),
  departmentId: z.string({ required_error: "Please select a department." }),
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

function ProgramSkeleton() {
  return (
    <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 space-y-6">
      {/* Form Card */}
      <Card className="min-h-[300px]">
        <CardHeader>
          <div className="space-y-2">
            <div className="h-7 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-sm space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
            {/* Department Select */}
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
            {/* Submit Button */}
            <div className="flex gap-2">
              <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="min-h-[300px]">
        <CardHeader>
          <div className="space-y-2">
            <div className="h-7 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
            {/* Table Rows */}
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 py-4">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="flex justify-end gap-2">
                    <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProgramSettings() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: { name: "", departmentId: "" },
  });

  // Populate form fields when editing a program
  useEffect(() => {
    if (editingProgram) {
      form.reset({
        name: editingProgram.name,
        departmentId: editingProgram.departmentId.toString(),
      });
    }
  }, [editingProgram]);

  // Fetch data on mount
  useEffect(() => {
    fetchDepartments();
    fetchPrograms();
  }, []);

  async function fetchDepartments() {
    try {
      const response = await fetch("/api/departments", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) throw new Error("Failed to fetch departments");
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({
        title: "Error",
        description: "Failed to load departments.",
        variant: "destructive",
      });
    }
  }

  async function fetchPrograms() {
    try {
      const response = await fetch("/api/programs", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      const data = await response.json();
      setPrograms(data);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast({
        title: "Error",
        description: "Failed to load programs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data: ProgramFormValues) {
    setIsSubmitting(true);
    try {
      if (editingProgram) {
        // Update
        const response = await fetch(`/api/programs/${editingProgram.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            departmentId: parseInt(data.departmentId),
          }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Failed to update program");
        }
        await fetchPrograms();
        toast({
          title: "Program updated",
          description: `${data.name} updated successfully.`,
        });
        setEditingProgram(null);
      } else {
        // Create
        const response = await fetch("/api/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            departmentId: parseInt(data.departmentId),
          }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Failed to create program");
        }
        await fetchPrograms();
        toast({
          title: "Program added",
          description: `${data.name} added successfully.`,
        });
      }
      form.reset({ name: "", departmentId: "" });
    } catch (error) {
      console.error("Error saving program:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save program.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(program: Program) {
    setEditingProgram(program);
  }

  function cancelEditing() {
    setEditingProgram(null);
    form.reset({ name: "", departmentId: "" });
  }

  function openDeleteConfirm(program: Program) {
    setProgramToDelete(program);
    setConfirmDialogOpen(true);
  }

  async function confirmDelete() {
    if (!programToDelete) return;
    try {
      const response = await fetch(`/api/programs/${programToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to delete program"); // now matches { message: '...' }
      }
      await fetchPrograms();
      toast({
        title: "Program deleted",
        description: `${programToDelete.name} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting program:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete program.",
        variant: "destructive",
      });
    } finally {
      setConfirmDialogOpen(false);
      setProgramToDelete(null);
    }
  }
  if (isLoading) return <ProgramSkeleton />;

  return (
    <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 space-y-6">
      {/* Form Card */}
      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>
            {editingProgram ? "Edit Program" : "Add Program"}
          </CardTitle>
          <CardDescription>
            {editingProgram
              ? "Update existing program"
              : "Create a new program"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Department Select */}
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingProgram ? "Update Program" : "Add Program"}
                </Button>
                {editingProgram && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEditing}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>Programs</CardTitle>
          <CardDescription>Manage existing programs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>{program.department.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => startEditing(program)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteConfirm(program)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the program "{programToDelete?.name}
              ". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
