"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import {
  passwordFormSchema,
  type PasswordFormValues,
} from "../../lib/form-schemas";

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

// Field types
type FieldType = {
  value: string;
  onChange: (value: string | React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<HTMLInputElement>;
};

export function ChangePassword() {
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

      // Call API to update password
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast({
          title: "Password Updated Successfully",
          description:
            "Your password has been updated. Please log in again with your new password.",
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
      } else {
        handlePasswordUpdateError(response.status, responseData);
      }
    } catch (error) {
      console.error("Password update error:", error);
      handlePasswordUpdateNetworkError(error);
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  function handlePasswordUpdateError(status: number, responseData: any) {
    let errorMessage = "Failed to update password.";
    let errorTitle = "Password Update Failed";

    switch (status) {
      case 400:
        if (responseData.details) {
          errorTitle = "Password Requirements Not Met";
          errorMessage = `Please ensure your password meets all requirements: ${responseData.details.join(", ")}`;
        } else if (responseData.warnings) {
          errorTitle = "Password Security Issue";
          errorMessage = `Password contains insecure patterns: ${responseData.warnings.join(", ")}. Please choose a more secure password.`;
        } else {
          errorMessage =
            responseData.error || "Invalid password data provided.";
        }
        break;
      case 401:
        handleUnauthorizedError(responseData);
        return;
      case 404:
        errorTitle = "Account Not Found";
        errorMessage =
          "Your account could not be found. Please contact support for assistance.";
        break;
      case 429:
        errorTitle = "Too Many Attempts";
        errorMessage =
          "You've made too many password change attempts. Please wait 15 minutes before trying again for security reasons.";
        break;
      case 500:
        errorTitle = "Server Error";
        errorMessage =
          "We're experiencing technical difficulties. Please try again in a few moments or contact support if the problem persists.";
        break;
      default:
        errorMessage =
          responseData.error ||
          "An unexpected error occurred while updating your password.";
    }

    toast({
      title: errorTitle,
      description: errorMessage,
      variant: "destructive",
    });
  }

  function handleUnauthorizedError(responseData: any) {
    if (responseData.error?.includes("Current password")) {
      const errorTitle = "Authentication Failed";
      const errorMessage =
        responseData.message ||
        "The current password you entered is incorrect. Please double-check and try again. Make sure Caps Lock is off and you're using the same password you use to log in.";

      passwordForm.setValue("currentPassword", "");
      passwordForm.setFocus("currentPassword");
      passwordForm.setError("currentPassword", {
        type: "manual",
        message: "Incorrect password - please try again",
      });

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Session Expired",
        description:
          "Your session has expired. Please log in again to continue.",
        variant: "destructive",
      });
    }
  }

  function handlePasswordUpdateNetworkError(error: any) {
    let errorMessage = "There was a problem updating your password.";

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
  }

  return (
    <Card className="min-h-[250px]">
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Change your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }: { field: FieldType }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4" />
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
                      <Lock className="absolute left-3 top-3 h-4 w-4" />
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
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-200">
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

                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {Object.entries(passwordStrength.requirements).map(
                          ([key, met]) => (
                            <div
                              key={key}
                              className={`flex items-center gap-1 ${
                                met ? "text-green-600" : "text-gray-500"
                              }`}
                            >
                              <span
                                className={`h-3 w-3 rounded-full ${
                                  met ? "bg-green-500" : "bg-gray-300"
                                }`}
                              />
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </div>
                          )
                        )}
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
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }: { field: FieldType }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4" />
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

            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={
                isPasswordSubmitting ||
                !passwordForm.formState.isDirty ||
                passwordStrength.score < 4
              }
            >
              {isPasswordSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  Update Password
                  {passwordStrength.score < 4 &&
                    passwordForm.watch("newPassword") && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Strengthen Password
                      </span>
                    )}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
