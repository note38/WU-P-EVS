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
import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
const ProfileSection = ({ user }: { user: any }) => {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await user.update({ firstName, lastName });
      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been updated.",
      });
    } catch (err: any) {
      console.error("Error updating profile:", JSON.stringify(err, null, 2));
      const errorMessage =
        err.errors?.[0]?.longMessage ||
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

  const isChanged = firstName !== user.firstName || lastName !== user.lastName;
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
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-xl">
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
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="h-4 w-4" />
                </Button>
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
                    Member
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
            Email Addresses
          </CardTitle>
          <CardDescription>
            Manage your email addresses and set your primary email.
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
                    {user.primaryEmailAddressId === email.id
                      ? "Primary email"
                      : "Secondary email"}
                  </p>
                </div>
              </div>
              {user.primaryEmailAddressId === email.id && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Primary
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t bg-muted/20">
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add New Email Address
          </Button>
        </CardFooter>
      </Card>

      {/* Connected Accounts */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Manage your social and external account connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">
                  Connected via OAuth
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Action Required
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20">
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Connect New Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Security Section Component
const SecuritySection = ({ user }: { user: any }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signOut } = useClerk();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await user.updatePassword({ currentPassword, newPassword });
      toast({
        title: "Password updated successfully!",
        description: "Your password has been updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      console.error("Error updating password:", err);
      const errorMessage =
        err.errors?.[0]?.longMessage ||
        "Failed to update password. Check your current password.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await user.delete();
      // Sign out - will redirect to "/" as configured in clerk.ts
      await signOut();
    } catch (err) {
      console.error("Error deleting account:", err);
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive",
      });
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/20 border">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Password</p>
                  <p className="text-xs text-muted-foreground">
                    {user.passwordEnabled ? "Enabled" : "Not set"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/20 border">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Email Verified</p>
                  <p className="text-xs text-muted-foreground">
                    {user.primaryEmailAddress?.verification?.status ===
                    "verified"
                      ? "Yes"
                      : "Pending"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/20 border">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Two-Factor</p>
                  <p className="text-xs text-muted-foreground">Not enabled</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      {user.passwordEnabled ? (
        <Card className="border-0 shadow-lg">
          <form onSubmit={handleChangePassword}>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure. Use a strong,
                unique password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <Input
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter a new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Password should be at least 8 characters long and include a
                  mix of letters, numbers, and symbols.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-between">
              <p className="text-sm text-muted-foreground">
                Your password was last updated recently
              </p>
              <Button
                type="submit"
                disabled={isSubmitting || !currentPassword || !newPassword}
                className="transition-all hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Password Authentication
            </CardTitle>
            <CardDescription>
              Set up password authentication for additional security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/20 border">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">No password set</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You signed up using a social provider. Consider setting up a
                  password for additional security.
                </p>
              </div>
              <Button variant="outline">Set Password</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage where you're signed in and review recent activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium">Current Session</p>
                  <p className="text-sm text-muted-foreground">
                    Chrome on Windows • {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20">
          <Button variant="outline" className="w-full">
            Sign Out All Other Sessions
          </Button>
        </CardFooter>
      </Card>

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

      // Update user profile using Clerk's user.update method
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
      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={imageSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-0">
          <div className="space-y-6">
            <div className="animate-in slide-in-from-left-2 duration-300">
              <ProfileSection user={user} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <div className="space-y-6">
            <div className="animate-in slide-in-from-right-2 duration-300">
              <SecuritySection user={user} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
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
