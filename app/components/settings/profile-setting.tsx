"use client";

import type React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail, Upload, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cropImage } from "../../lib/image-utils";
import { useUserAvatar } from "@/hooks/use-user-avatar";

// Cache utility for profile data
const profileCache = {
  data: null as any | null,
  timestamp: 0,
  ttl: 30000, // 30 seconds in milliseconds

  set(data: any) {
    this.data = data;
    this.timestamp = Date.now();
  },

  get() {
    if (this.data && Date.now() - this.timestamp < this.ttl) {
      return this.data;
    }
    return null;
  },

  clear() {
    this.data = null;
  },
};

const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    newPassword: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        {
          message:
            "Password must include uppercase, lowercase, number, and special character.",
        }
      ),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function ProfileSettings() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { avatar, updateAvatar, refreshAvatar } = useUserAvatar();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Form initialization with empty defaults
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
    },
    mode: "onChange",
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

  // Fetch user profile when component mounts
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoading(true);

        // Check cache first
        const cachedData = profileCache.get();
        if (cachedData) {
          profileForm.reset({
            username: cachedData.username,
            email: cachedData.email,
          });

          // Set original avatar for comparison
          setOriginalAvatar(cachedData.avatar || null);
          setAvatarChanged(false);

          setIsLoading(false);
          return;
        }

        // If no cache, fetch from API
        const response = await fetch("/api/users/profile", {
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (response.ok) {
          const userData = await response.json();

          // Update form with user data
          profileForm.reset({
            username: userData.username,
            email: userData.email,
          });

          // Set original avatar for comparison
          setOriginalAvatar(userData.avatar || null);
          setAvatarChanged(false);

          // Update cache
          profileCache.set(userData);
        } else {
          toast({
            title: "Error",
            description: "Failed to load your profile information.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({
          title: "Error",
          description: "Something went wrong while loading your profile.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchUserProfile();
    }
  }, [session, profileForm]);

  // Track avatar changes
  useEffect(() => {
    setAvatarChanged(avatar !== originalAvatar);
  }, [avatar, originalAvatar]);

  async function onProfileSubmit(data: ProfileFormValues) {
    try {
      setIsProfileSubmitting(true);

      // Prepare data for API
      const updateData: any = {
        username: data.username,
        email: data.email,
        avatar: avatar, // Always include avatar (can be string or null)
      };

      // Call API to update profile with optimized headers
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal", // Prisma optimization hint
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Clear cache to force refresh on next load
        profileCache.clear();

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });

        // Update session with new data to reflect changes immediately
        await updateSession();

        // Update cache with new data
        const updatedData = { ...updateData };
        profileCache.set(updatedData);

        // Refresh avatar in global state
        await refreshAvatar();

        // Reset avatar change tracking
        setOriginalAvatar(avatar);
        setAvatarChanged(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
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

  async function onPasswordSubmit(data: PasswordFormValues) {
    try {
      setIsPasswordSubmitting(true);

      // Call API to update password with optimized headers
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal", // Prisma optimization hint
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
        });

        // Reset password form
        passwordForm.reset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update password");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem updating your password.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordSubmitting(false);
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

  const onCropComplete = useCallback(
    (
      croppedArea: any,
      croppedAreaPixels: { x: number; y: number; width: number; height: number }
    ) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropCancel = () => {
    setCropperOpen(false);
    setImageSrc(null);
  };

  const handleCropSave = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) {
        return;
      }

      // Apply the crop using advanced crop function
      const croppedImage = await cropImage(
        imageSrc,
        {
          x: croppedAreaPixels.x,
          y: croppedAreaPixels.y,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
        },
        512,
        512
      );

      // Update global avatar state
      updateAvatar(croppedImage);

      // Close the cropper
      setCropperOpen(false);
      setImageSrc(null);

      toast({
        title: "Avatar cropped",
        description:
          "Your avatar has been cropped successfully. Don't forget to save your changes.",
      });
    } catch (error) {
      console.error("Error cropping image:", error);
      toast({
        title: "Crop Error",
        description: "There was a problem cropping your image.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAvatar = () => {
    updateAvatar(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Image Cropper Dialog */}
      <Dialog open={cropperOpen} onOpenChange={setCropperOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop your avatar</DialogTitle>
          </DialogHeader>
          <div className="relative h-64 w-full mt-4">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>
          <div className="mt-4">
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <DialogFooter className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleCropCancel}>
              Cancel
            </Button>
            <Button onClick={handleCropSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Increased the size of the Avatar component */}
            <Avatar className="h-40 w-40 border-4 border-muted">
              <AvatarImage
                src={avatar || ""}
                alt="Profile Avatar"
                className="object-cover"
              />
              <AvatarFallback className="bg-muted">
                <User className="h-20 w-20 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-2">
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  <Upload className="h-4 w-4" />
                  Change Avatar
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="sr-only"
                  onChange={handleImageSelect}
                  aria-label="Upload avatar image"
                />
              </label>
              {avatar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  aria-label="Remove avatar image"
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: JPG, JPEG, PNG. Max size: 5MB.
            </p>
          </div>

          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="username">Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="username"
                          className="pl-10"
                          placeholder="Your name"
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
                control={profileForm.control}
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
                          placeholder="Your email"
                          type="email"
                          {...field}
                          aria-required="true"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      This is the email address you use to sign in.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={
                  isProfileSubmitting ||
                  (!profileForm.formState.isDirty && !avatarChanged)
                }
                className="w-full md:w-auto"
              >
                {isProfileSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    {avatarChanged && (
                      <span className="ml-2 text-xs bg-white/20 text-white px-2 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                        Avatar Updated
                      </span>
                    )}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="currentPassword">
                      Current Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="currentPassword"
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
                              ? "Hide current password"
                              : "Show current password"
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="newPassword">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          className="pl-10"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                          aria-required="true"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-10 w-10"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
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
                    <FormDescription>
                      Password must include uppercase, lowercase, number, and
                      special character.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="confirmPassword">
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
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

              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={
                  isPasswordSubmitting || !passwordForm.formState.isDirty
                }
              >
                {isPasswordSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
