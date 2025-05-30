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
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
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
};

// Enhanced form validation schema
const adminAccountFormSchema = z
  .object({
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
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .max(128, {
        message: "Password must be less than 128 characters.",
      })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, {
        message: "Password must include uppercase, lowercase, and number.",
      }),
    confirmPassword: z.string().min(1, {
      message: "Please confirm the password.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadedAvatars, setLoadedAvatars] = useState<Record<number, boolean>>(
    {}
  );

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    strengthText: "",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
    },
  });

  // Form setup with validation
  const form = useForm<AdminAccountFormValues>({
    resolver: zodResolver(adminAccountFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  // Helper function to get avatar URL
  const getAvatarUrl = (user: User) => {
    if (!user.avatar) {
      // Return UI Avatars URL with optimized parameters
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.username
      )}&background=random&size=96`; // Specify exact size needed
    }

    // If avatar is already a full URL
    if (
      user.avatar.startsWith("http://") ||
      user.avatar.startsWith("https://")
    ) {
      return user.avatar;
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
  };

  const handleAvatarLoad = (userId: number) => {
    setLoadedAvatars((prev) => ({ ...prev, [userId]: true }));
  };

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    let feedback = "";
    let strengthText = "";

    if (score === 0) {
      strengthText = "";
      feedback = "";
    } else if (score < 3) {
      strengthText = "Weak";
      feedback = "Password is too weak";
    } else if (score < 4) {
      strengthText = "Fair";
      feedback = "Password could be stronger";
    } else {
      strengthText = "Strong";
      feedback = "Password meets all requirements";
    }

    return {
      score,
      feedback,
      strengthText,
      requirements,
    };
  };

  useEffect(() => {
    // Fetch existing admin users
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users?role=ADMIN&include=avatar", {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        const data = await response.json();
        console.log("Fetched users with avatars:", data); // Debug log
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
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

      // Create submission data (without confirmPassword)
      const submissionData = {
        username: data.username,
        email: data.email,
        password: data.password,
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
        setUsers([...users, responseData]);

        // Reset form
        form.reset();

        // Reset password strength indicator
        setPasswordStrength({
          score: 0,
          feedback: "",
          strengthText: "",
          requirements: {
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
          },
        });

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

  if (loading) {
    return <AccountSkeleton />;
  }

  return (
    <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 space-y-6">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            className="pl-10"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            {...field}
                            aria-required="true"
                            onChange={(e) => {
                              field.onChange(e);
                              const strength = checkPasswordStrength(
                                e.target.value
                              );
                              setPasswordStrength(strength);
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>

                      {/* Password Strength Indicator */}
                      {field.value && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  passwordStrength.score < 3
                                    ? "bg-red-500"
                                    : passwordStrength.score < 4
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                                style={{
                                  width: `${(passwordStrength.score / 4) * 100}%`,
                                }}
                              />
                            </div>
                            {passwordStrength.strengthText && (
                              <span
                                className={`text-sm font-medium ${
                                  passwordStrength.score < 3
                                    ? "text-red-600"
                                    : passwordStrength.score < 4
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                }`}
                              >
                                {passwordStrength.strengthText}
                              </span>
                            )}
                          </div>

                          {/* Requirements Checklist */}
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div
                              className={`flex items-center gap-1 ${
                                passwordStrength.requirements.length
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  passwordStrength.requirements.length
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                              />
                              8+ characters
                            </div>
                            <div
                              className={`flex items-center gap-1 ${
                                passwordStrength.requirements.number
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  passwordStrength.requirements.number
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                              />
                              Number
                            </div>
                            <div
                              className={`flex items-center gap-1 ${
                                passwordStrength.requirements.uppercase
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  passwordStrength.requirements.uppercase
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                              />
                              Uppercase letter
                            </div>
                            <div
                              className={`flex items-center gap-1 ${
                                passwordStrength.requirements.lowercase
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  passwordStrength.requirements.lowercase
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                              />
                              Lowercase letter
                            </div>
                          </div>
                        </div>
                      )}

                      <FormDescription>
                        Password must include uppercase, lowercase, and number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="confirmPassword">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            className="pl-10"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            {...field}
                            aria-required="true"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                              showConfirmPassword
                                ? "Hide confirm password"
                                : "Show confirm password"
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
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
                disabled={
                  isSubmitting ||
                  !form.formState.isDirty ||
                  passwordStrength.score < 4
                }
                className="w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Admin Account
                    {passwordStrength.score < 4 && form.watch("password") && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Strengthen Password
                      </span>
                    )}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>Admin Accounts</CardTitle>
          <CardDescription>
            View and manage existing administrator accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9">
                          {!loadedAvatars[user.id] && <AvatarSkeleton />}
                          <Avatar
                            className={`h-9 w-9 transition-opacity duration-300 ${
                              loadedAvatars[user.id]
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            <AvatarImage
                              src={getAvatarUrl(user)}
                              alt={user.username}
                              onLoad={() => handleAvatarLoad(user.id)}
                              loading="lazy"
                              onError={(e) => {
                                console.log(
                                  `Failed to load avatar for ${user.username}:`,
                                  getAvatarUrl(user)
                                );
                                handleAvatarLoad(user.id); // Show fallback on error
                              }}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
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
