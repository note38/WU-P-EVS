"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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

// Define types - keeping API response types as numbers
type Department = {
  id: number;
  name: string;
};

type Year = {
  id: number;
  name: string;
  departmentId: number;
  department: {
    id: number;
    name: string;
  };
};

// Define the form schema - forms work with strings
const yearFormSchema = z.object({
  name: z.string().min(2, {
    message: "Year name must be at least 2 characters.",
  }),
  departmentId: z.string({
    required_error: "Please select a department.",
  }),
});

type YearFormValues = z.infer<typeof yearFormSchema>;

// Define the YearSkeleton component
function YearSkeleton() {
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
            {/* Year Name Field */}
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>

            {/* Department Select Field */}
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

export function YearSettings() {
  const [years, setYears] = useState<Year[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingYear, setEditingYear] = useState<Year | null>(null);
  const [yearToDelete, setYearToDelete] = useState<Year | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const form = useForm<YearFormValues>({
    resolver: zodResolver(yearFormSchema),
    defaultValues: {
      name: "",
      departmentId: "",
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchDepartments();
    fetchYears();
  }, []);

  // Update form when editing year changes
  useEffect(() => {
    if (editingYear) {
      form.setValue("name", editingYear.name);
      form.setValue("departmentId", editingYear.departmentId.toString());
    } else {
      form.reset({
        name: "",
        departmentId: "",
      });
    }
  }, [editingYear, form]);

  async function fetchDepartments() {
    try {
      const response = await fetch("/api/departments", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }

      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({
        title: "Error",
        description: "Failed to load departments. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function fetchYears() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/years", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch years");
      }

      const data = await response.json();
      setYears(data);
    } catch (error) {
      console.error("Error fetching years:", error);
      toast({
        title: "Error",
        description: "Failed to load years. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data: YearFormValues) {
    setIsSubmitting(true);

    try {
      if (editingYear) {
        // Update existing year
        const response = await fetch(`/api/years/${editingYear.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            departmentId: parseInt(data.departmentId), // Convert string to number for API
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update year");
        }

        // Refresh years list to ensure UI is in sync with database
        await fetchYears();

        toast({
          title: "Year updated",
          description: `${data.name} has been updated successfully.`,
        });

        setEditingYear(null);
      } else {
        // Create new year
        const response = await fetch("/api/years", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            departmentId: parseInt(data.departmentId), // Convert string to number for API
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create year");
        }

        // Refresh years list to ensure UI is in sync with database
        await fetchYears();

        toast({
          title: "Year added",
          description: `${data.name} has been added successfully.`,
        });
      }

      form.reset({
        name: "",
        departmentId: "",
      });
    } catch (error) {
      console.error("Error saving year:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save year. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(year: Year) {
    setEditingYear(year);
  }

  function cancelEditing() {
    setEditingYear(null);
    form.reset({
      name: "",
      departmentId: "",
    });
  }

  function openDeleteConfirm(year: Year) {
    setYearToDelete(year);
    setConfirmDialogOpen(true);
  }

  async function confirmDelete() {
    if (!yearToDelete) return;

    try {
      const response = await fetch(`/api/years/${yearToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete year");
      }

      // Refresh years list to ensure UI is in sync with database
      await fetchYears();

      toast({
        title: "Year deleted",
        description: `${yearToDelete.name} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting year:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete year. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmDialogOpen(false);
      setYearToDelete(null);
    }
  }

  if (isLoading) {
    return <YearSkeleton />;
  }

  return (
    <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 space-y-6">
      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>{editingYear ? "Edit Year" : "Add Year"}</CardTitle>
          <CardDescription>
            {editingYear
              ? "Update an existing academic year in the system."
              : "Create a new academic year for a department."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Level</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., First Year" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingYear ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingYear ? "Update Year" : "Add Year"}
                </Button>

                {editingYear && (
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

      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>Academic Years</CardTitle>
          <CardDescription>
            Manage existing academic years in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No academic years found. Add your first year above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-[150px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.name}</TableCell>
                    <TableCell>{year.department.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => startEditing(year)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteConfirm(year)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the year "{yearToDelete?.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
