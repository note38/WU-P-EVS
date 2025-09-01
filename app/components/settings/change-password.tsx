"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

// Import UI components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Password form schema
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Field types
type FieldType = {
  value: string;
  onChange: (value: string | React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<HTMLInputElement>;
};

export function ChangePassword() {
  const { user } = useUser();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

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

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

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

  async function onPasswordSubmit(data: PasswordFormValues) {
    if (!user) return;

    try {
      setIsPasswordSubmitting(true);

      // Additional client-side validation
      if (data.currentPassword === data.newPassword) {
        toast({
          title: "Invalid Password",
          description: "New password must be different from current password.",
          variant: "destructive",
        });
        return;
      }

      // Use Clerk's updatePassword method
      await user.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast({
        title: "Password Updated Successfully",
        description: "Your password has been updated successfully.",
      });

      // Reset form
      passwordForm.reset();
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
    } catch (error: any) {
      console.error("Password update error:", error);

      // Handle Clerk-specific errors
      let errorMessage = "There was a problem updating your password.";

      if (error?.errors?.[0]?.message) {
        errorMessage = error.errors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Handle specific error cases
      if (errorMessage.includes("current_password_invalid")) {
        passwordForm.setValue("currentPassword", "");
        passwordForm.setFocus("currentPassword");
        passwordForm.setError("currentPassword", {
          type: "manual",
          message: "Current password is incorrect",
        });
        errorMessage = "The current password you entered is incorrect.";
      }

      toast({
        title: "Password Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  if (!user) {
    return (
      <Card className="min-h-[250px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Password & Security
          </CardTitle>
          <CardDescription>
            Please sign in to manage your password settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You need to be signed in to change your password.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Password & Security
        </CardTitle>
        <CardDescription>
          Change your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-6"
          >
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }: { field: FieldType }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        {...field}
                        aria-required="true"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        aria-label={
                          showCurrentPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showCurrentPassword ? (
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

            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }: { field: FieldType }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        {...field}
                        aria-required="true"
                        onChange={(e) => {
                          field.onChange(e);
                          setPasswordStrength(
                            checkPasswordStrength(e.target.value)
                          );
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={
                          showNewPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>

                  {field.value && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted">
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

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(passwordStrength.requirements).map(
                          ([key, met]) => (
                            <div
                              key={key}
                              className={`flex items-center gap-2 ${
                                met ? "text-green-600" : "text-muted-foreground"
                              }`}
                            >
                              <div
                                className={`h-3 w-3 rounded-full border-2 ${
                                  met
                                    ? "bg-green-500 border-green-500"
                                    : "border-muted-foreground"
                                }`}
                              />
                              <span>
                                {key === "length"
                                  ? "8+ characters"
                                  : key === "uppercase"
                                    ? "Uppercase letter"
                                    : key === "lowercase"
                                      ? "Lowercase letter"
                                      : "Number"}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <FormDescription>
                    Password must be at least 8 characters with uppercase,
                    lowercase, and number.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }: { field: FieldType }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
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
                            ? "Hide password"
                            : "Show password"
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

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 sm:flex-none sm:min-w-[140px]"
                disabled={
                  isPasswordSubmitting ||
                  !passwordForm.formState.isDirty ||
                  passwordStrength.score < 4
                }
              >
                {isPasswordSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  passwordForm.reset();
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
                }}
                disabled={
                  isPasswordSubmitting || !passwordForm.formState.isDirty
                }
                className="flex-1 sm:flex-none sm:min-w-[100px]"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
