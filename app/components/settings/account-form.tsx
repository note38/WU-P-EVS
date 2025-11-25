"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Mail, User, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy components
const Table = dynamic(
  () => import("@/components/ui/table").then((mod) => mod.Table),
  { ssr: false }
);
const TableBody = dynamic(
  () => import("@/components/ui/table").then((mod) => mod.TableBody),
  { ssr: false }
);
const TableCell = dynamic(
  () => import("@/components/ui/table").then((mod) => mod.TableCell),
  { ssr: false }
);
const TableHead = dynamic(
  () => import("@/components/ui/table").then((mod) => mod.TableHead),
  { ssr: false }
);
const TableHeader = dynamic(
  () => import("@/components/ui/table").then((mod) => mod.TableHeader),
  { ssr: false }
);
const TableRow = dynamic(
  () => import("@/components/ui/table").then((mod) => mod.TableRow),
  { ssr: false }
);

type User = {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "VOTER";
  createdAt: string;
  avatar?: string;
  clerkId?: string;
};

// Enhanced form validation schema
const adminAccountFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(50, {
      message: "Username must be less than 50 characters.",
    }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type AdminAccountFormValues = z.infer<typeof adminAccountFormSchema>;

// Loading skeleton component
const AvatarSkeleton = () => (
  <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
);

// Define AccountSkeleton component
function AccountSkeleton() {
  return (
    <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 space-y-6">
      {/* Create Admin Form Card */}
      <Card className="min-h-[300px]">
        <CardHeader>
          <div className="space-y-2">
            <div className="h-7 w-24 bg-muted rounded animate-pulse" />
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full space-y-6">
            {/* Username and Email Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-64 bg-muted rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        </CardFooter>
      </Card>

      {/* Admin Accounts Table Card */}
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
            <div className="grid grid-cols-3 gap-4 pb-4 border-b">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>

            {/* Table Rows */}
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AccountSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false); // For automatic syncing

  // Form setup with validation
  const form = useForm<AdminAccountFormValues>({
    resolver: zodResolver(adminAccountFormSchema),
    defaultValues: {
      username: "",
      email: "",
    },
    mode: "onChange",
  });

  // Helper function to get avatar URL
  const getAvatarUrl = (user: User) => {
    // If user has a Clerk ID and an avatar URL, use the Clerk avatar
    if (user.clerkId && user.avatar) {
      // Validate that avatar is a proper URL
      try {
        new URL(user.avatar);
        return user.avatar;
      } catch (e) {
        // If not a valid URL, use fallback
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.username
        )}&background=random&size=96`;
      }
    }

    // If user has a Clerk ID but no avatar in database, use fallback
    if (user.clerkId && !user.avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.username
      )}&background=random&size=96`;
    }

    // If user doesn't have a Clerk ID but has a local avatar
    if (!user.clerkId && user.avatar) {
      // Check if avatar is a valid URL
      if (
        user.avatar.startsWith("http://") ||
        user.avatar.startsWith("https://")
      ) {
        try {
          new URL(user.avatar);
          return user.avatar;
        } catch (e) {
          // If not a valid URL, use fallback
          return `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.username
          )}&background=random&size=96`;
        }
      }

      // If avatar is a base64 string
      if (user.avatar.startsWith("data:image/")) {
        return user.avatar;
      }

      // If avatar is a path or filename, construct the URL
      if (user.avatar.startsWith("/")) {
        return user.avatar;
      }

      // Default case - assume it's a filename
      return `/avatars/${user.avatar}`;
    }

    // If no avatar is available, use UI Avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.username
    )}&background=random&size=96`;
  };

  // Auto-sync avatars when component mounts
  useEffect(() => {
    const autoSyncAvatars = async () => {
      setAutoSyncing(true);
      try {
        // Call the manual sync endpoint to ensure avatars are up to date
        const response = await fetch("/api/auth/manual-sync", {
          method: "POST",
        });

        if (response.ok) {
          console.log("✅ Avatars auto-synced successfully");
        }
      } catch (error) {
        console.error("Failed to auto-sync avatars:", error);
        // Don't show error toast for auto-sync to avoid annoying users
      } finally {
        setAutoSyncing(false);
      }
    };

    // Auto-sync on component mount
    autoSyncAvatars();
  }, []);

  useEffect(() => {
    // Fetch existing admin users
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users?role=ADMIN", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        const data = await response.json();

        // Check if the response contains an error
        if (data && typeof data === "object" && "error" in data) {
          console.error("API returned error:", data.error);
          setUsers([]);
          toast({
            title: "Error",
            description:
              data.error || "Failed to load admin accounts. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Ensure data is an array, if not, set empty array
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error("API returned non-array data:", data);
          setUsers([]);
          toast({
            title: "Error",
            description: "Invalid data received from server. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setUsers([]);
        toast({
          title: "Error",
          description: "Failed to load admin accounts. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const onSubmit = async (data: AdminAccountFormValues) => {
    try {
      setIsSubmitting(true);

      // Create submission data
      const submissionData = {
        username: data.username,
        email: data.email,
        role: "ADMIN" as const,
      };

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Add new user to the list
        setUsers([...(Array.isArray(users) ? users : []), responseData]);

        // Reset form
        form.reset();

        toast({
          title: "Admin Account Created",
          description: "The admin account has been created successfully!",
        });
      } else {
        // Handle specific error cases
        let errorMessage = "Failed to create admin account.";
        let errorTitle = "Account Creation Failed";

        switch (response.status) {
          case 400:
            if (responseData.details) {
              errorTitle = "Validation Error";
              errorMessage = `Please fix the following issues: ${responseData.details.join(", ")}`;
            } else if (responseData.warnings) {
              errorTitle = "Password Security Issue";
              errorMessage = `Password contains insecure patterns: ${responseData.warnings.join(", ")}. Please choose a more secure password.`;
            } else {
              errorMessage =
                responseData.error || "Invalid account data provided.";
            }
            break;
          case 409:
            errorTitle = "Account Already Exists";
            errorMessage =
              "An account with this email address already exists. Please use a different email address.";
            // Focus on email field
            form.setFocus("email");
            form.setError("email", {
              type: "manual",
              message: "Email already exists",
            });
            break;
          case 422:
            errorTitle = "Invalid Data";
            errorMessage =
              "The provided data is invalid. Please check all fields and try again.";
            break;
          case 500:
            errorTitle = "Server Error";
            errorMessage =
              "We're experiencing technical difficulties. Please try again in a few moments.";
            break;
          default:
            errorMessage =
              responseData.error ||
              "An unexpected error occurred while creating the account.";
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create admin account:", error);

      // Handle network errors
      let errorMessage = "There was a problem creating the admin account.";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add delete user function
  const handleDeleteUser = async (userId: number, hasClerkId: boolean) => {
    if (hasClerkId) {
      toast({
        title: "Cannot Delete User",
        description:
          "Users with Clerk ID cannot be deleted from this interface.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove user from the list
        setUsers(users.filter((user) => user.id !== userId));
        toast({
          title: "User Deleted",
          description: "The user has been successfully deleted.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Delete Failed",
          description: errorData.error || "Failed to delete user.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the user.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <AccountSkeleton />;
  }

  return (
    <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
        <div className="flex">
          <div className="flex-shrink-0">
            <Lock className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Password Protection Enabled:</strong> This section
              requires password verification for access. Changes to admin
              accounts affect system security.
            </p>
          </div>
        </div>
      </div>

      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>Create Admin Account</CardTitle>
          <CardDescription>
            Add a new administrator account to the system.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="username">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="username"
                            className="pl-10"
                            placeholder="Enter username"
                            {...field}
                            aria-required="true"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            className="pl-10"
                            type="email"
                            placeholder="admin@example.com"
                            {...field}
                            aria-required="true"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value="ADMIN"
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-sm text-muted-foreground">
                  Role is automatically set to Administrator for new admin
                  accounts.
                </p>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isDirty}
                className="w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>Create Admin Account</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="min-h-[300px]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Admin Accounts</CardTitle>
              <CardDescription>
                View and manage existing administrator accounts.
              </CardDescription>
            </div>
            {autoSyncing && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing avatars...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading admin accounts...</p>
            </div>
          ) : !Array.isArray(users) || users.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No admin accounts found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* Simplified avatar display - no loading state */}
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={getAvatarUrl(user)}
                            alt={user.username}
                            onError={(e) => {
                              // Fallback to UI avatars if image fails to load
                              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user.username
                              )}&background=random&size=96`;
                              e.currentTarget.src = fallbackUrl;
                            }}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteUser(user.id, !!user.clerkId)
                        }
                        disabled={!!user.clerkId}
                        className={
                          user.clerkId
                            ? "opacity-50 cursor-not-allowed"
                            : "text-destructive hover:text-destructive"
                        }
                        title={
                          user.clerkId
                            ? "Cannot delete users with Clerk ID"
                            : "Delete user"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Add preconnect hint for avatar service
export const metadata = {
  head: {
    link: [
      {
        rel: "preconnect",
        href: "https://ui-avatars.com",
      },
    ],
  },
};
