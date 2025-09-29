"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Mail,
  Upload,
  User,
  Shield,
  Plus,
  KeyRound,
  Trash2,
  Camera,
  Save,
  AlertTriangle,
  X,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useUser, useClerk } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { toast } from "@/hooks/use-toast";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "../../lib/form-schemas";
import { ChangePassword } from "./change-password";
import { ImageCropper } from "./image-cropper";
import { SettingsSkeleton } from "./settings-skeleton";

// Import frequently used small components directly
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Lazy load larger components
const Form = dynamic(() =>
  import("@/components/ui/form").then((mod) => mod.Form)
);
const FormField = dynamic(() =>
  import("@/components/ui/form").then((mod) => mod.FormField)
);
const FormItem = dynamic(() =>
  import("@/components/ui/form").then((mod) => mod.FormItem)
);
const FormLabel = dynamic(() =>
  import("@/components/ui/form").then((mod) => mod.FormLabel)
);
const FormControl = dynamic(() =>
  import("@/components/ui/form").then((mod) => mod.FormControl)
);
const FormMessage = dynamic(() =>
  import("@/components/ui/form").then((mod) => mod.FormMessage)
);
const FormDescription = dynamic(() =>
  import("@/components/ui/form").then((mod) => mod.FormDescription)
);

const Card = dynamic(() =>
  import("@/components/ui/card").then((mod) => mod.Card)
);
const CardContent = dynamic(() =>
  import("@/components/ui/card").then((mod) => mod.CardContent)
);
const CardHeader = dynamic(() =>
  import("@/components/ui/card").then((mod) => mod.CardHeader)
);
const CardTitle = dynamic(() =>
  import("@/components/ui/card").then((mod) => mod.CardTitle)
);
const CardDescription = dynamic(() =>
  import("@/components/ui/card").then((mod) => mod.CardDescription)
);
const CardFooter = dynamic(() =>
  import("@/components/ui/card").then((mod) => mod.CardFooter)
);

// Type-safe Form components
const TypedForm = Form as any;
const TypedFormField = FormField as any;

// Field types
type FieldType = {
  value: string;
  onChange: (value: string | React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<HTMLInputElement>;
};

// Profile Section Component
const ProfileSection = ({
  user,
  onAvatarClick,
  onRemoveAvatar,
}: {
  user: any;
  onAvatarClick: () => void;
  onRemoveAvatar: () => void;
}) => {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [position, setPosition] = useState("");
  const [initialPosition, setInitialPosition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load user profile data from database
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/users/profile");
        if (response.ok) {
          const profileData = await response.json();
          const userPosition = profileData.position || "";
          setPosition(userPosition);
          setInitialPosition(userPosition);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Update Clerk user profile using the client-side method
      await user.update({ 
        firstName: firstName,
        lastName: lastName
      });

      // Update position in your database (always send position, even if empty)
      try {
        console.log("Sending position update:", { position });
        const response = await fetch("/api/users/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ position }),
        });

        console.log("Response status:", response.status, response.statusText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
            errorData = {
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
          }
          console.error("API Error:", errorData);
          throw new Error(
            errorData.error ||
              errorData.message ||
              `Failed to update position in database (HTTP ${response.status})`
          );
        }

        const responseData = await response.json();
        console.log("Position update successful:", responseData);

        // Update the initial position after successful save
        setInitialPosition(position);
      } catch (dbError: any) {
        console.error("Database update error:", dbError);
        toast({
          title: "Partial update",
          description: `Profile updated but position could not be saved to database. Error: ${dbError?.message || "Unknown error"}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been updated.",
      });
    } catch (err: any) {
      console.error("Error updating profile:", JSON.stringify(err, null, 2));
      const errorMessage =
        err.errors?.[0]?.longMessage ||
        err.message ||
        "Failed to update profile. Please check permissions in your Clerk dashboard.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isChanged =
    firstName !== user.firstName ||
    lastName !== user.lastName ||
    position !== initialPosition;
  const userInitial = user.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : "?";

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Cover Section */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16 sm:-mt-12">
              <div className="relative group">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer">
                      <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-xl transition-transform hover:scale-105">
                        <AvatarImage
                          src={user.imageUrl}
                          alt={user.fullName || "User"}
                        />
                        <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/20 to-primary/30">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      {/* Overlay hint */}
                      <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                          Change Photo
                        </div>
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    <DropdownMenuItem
                      onClick={onAvatarClick}
                      className="cursor-pointer"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Change Photo
                    </DropdownMenuItem>
                    {user.imageUrl && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={onRemoveAvatar}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Photo
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 sm:mt-0 flex-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  {user.fullName || "Anonymous User"}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    <User className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                  {user.emailAddresses.length > 1 && (
                    <Badge variant="outline" className="text-xs">
                      <Mail className="w-3 h-3 mr-1" />
                      {user.emailAddresses.length} emails
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="border-0 shadow-lg">
        <form onSubmit={handleSave}>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and how others see you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <Input
                placeholder="Enter your position or job title"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-between">
            <p className="text-sm text-muted-foreground">
              {isChanged ? "You have unsaved changes" : "All changes saved"}
            </p>
            <Button
              type="submit"
              disabled={!isChanged || isSubmitting}
              className="transition-all hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Email Management */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Address
          </CardTitle>
          <CardDescription>
            Manage your email address and set your primary email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.emailAddresses.map((email: any, index: number) => (
            <div
              key={email.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <div>
                  <p className="font-medium">{email.emailAddress}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.primaryEmailAddressId === email.id}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

// Security Section Component
const SecuritySection = ({ user }: { user: any }) => {
  const { signOut } = useClerk();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      console.log("Attempting to delete account for user:", user.id);
      // Call our new API endpoint for self-deletion
      const response = await fetch("/api/users/delete-account", {
        method: "DELETE",
      });

      console.log("Response received:", response.status, response.statusText);

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      console.log("Content type:", contentType);

      if (contentType && contentType.includes("application/json")) {
        const responseData = await response.json();
        console.log("Response data:", responseData);

        if (!response.ok) {
          const errorMessage = responseData.error || "Failed to delete account";
          console.log("Error from server:", errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        // If not JSON, log the text content for debugging
        const text = await response.text();
        console.log("Non-JSON response:", text);
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }

      console.log("Account deletion successful, signing out...");
      // Sign out - will redirect to "/" as configured in clerk.ts
      await signOut();
    } catch (err: any) {
      console.error("Error deleting account:", err);
      toast({
        title: "Error",
        description:
          err.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Danger Zone */}
      <Card className="border-0 shadow-lg border-red-200 dark:border-red-900/30 bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/20">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone. Please proceed
            with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                Delete Account
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Permanently remove your account and all associated data. This
                action cannot be reversed.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowConfirm(true)}
              className="mt-4 md:mt-0 md:ml-4 transition-all hover:scale-105"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-left">
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
              <br />
              <br />
              Are you absolutely sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Yes, Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export function ProfileSettings() {
  const { user, isLoaded } = useUser();
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // File input ref for avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form initialization
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
    },
    mode: "onChange",
  });

  // Initialize form with Clerk user data
  useEffect(() => {
    if (isLoaded && user) {
      profileForm.reset({
        username: user.fullName || user.firstName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      });
    }
  }, [isLoaded, user, profileForm]);

  async function onProfileSubmit(data: ProfileFormValues) {
    if (!user) return;

    try {
      setIsProfileSubmitting(true);

      // Update user profile using the client-side method
      await user.update({
        firstName: data.username.split(" ")[0] || data.username,
        lastName: data.username.split(" ").slice(1).join(" ") || "",
      });

      // Note: Email updates in Clerk require verification
      // If email is different, we need to add it as a new email address
      const currentEmail = user.primaryEmailAddress?.emailAddress;
      if (data.email !== currentEmail) {
        try {
          await user.createEmailAddress({ email: data.email });
          toast({
            title: "Email verification required",
            description:
              "Please check your new email address for a verification link.",
            variant: "default",
          });
        } catch (emailError) {
          console.error("Email update error:", emailError);
          toast({
            title: "Email update failed",
            description: "Could not update email address. Please try again.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsProfileSubmitting(false);
    }
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Avatar image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleCropComplete = async (croppedImage: string) => {
    if (!user) return;

    try {
      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();

      // Update avatar using Clerk's setProfileImage method
      await user.setProfileImage({ file: blob });

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error("Avatar update error:", error);
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCropCancel = () => {
    setImageSrc(null);
  };

  // Function to trigger file input when camera button is clicked
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    try {
      await user.setProfileImage({ file: null });
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error("Avatar removal error:", error);
      toast({
        title: "Error",
        description: "Failed to remove avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded) {
    return <SettingsSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 flex items-center justify-center">
        <p className="text-muted-foreground">
          Please sign in to view your profile settings.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 space-y-6">
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
        aria-label="Upload avatar image"
      />

      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={imageSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />

      <div className="w-full space-y-6">
        <div className="animate-in slide-in-from-left-2 duration-300">
          <ProfileSection
            user={user}
            onAvatarClick={handleAvatarClick}
            onRemoveAvatar={handleRemoveAvatar}
          />
        </div>
        <div className="animate-in slide-in-from-right-2 duration-300">
          <SecuritySection user={user} />
        </div>
      </div>
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
