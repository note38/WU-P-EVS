"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Upload, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { toast } from "@/hooks/use-toast";
import { useUserAvatar } from "@/hooks/use-user-avatar";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "../../lib/form-schemas";
import { profileCache } from "../../lib/cache-utils";
import { ChangePassword } from "./change-password";
import { ImageCropper } from "./image-cropper";
import { SettingsSkeleton } from "./settings-skeleton";

// Import frequently used small components directly
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { OptimizedAvatar } from "../../components/ui/optimized-avatar";

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

export function ProfileSettings() {
  const { data: session, update: updateSession } = useSession();
  const { avatar, updateAvatar, refreshAvatar } = useUserAvatar();
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);

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
        // const updatedData = { ...updateData };
        // profileCache.set(updatedData);

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

  const handleCropComplete = (croppedImage: string) => {
    updateAvatar(croppedImage);
  };

  const handleCropCancel = () => {
    setImageSrc(null);
  };

  const handleRemoveAvatar = () => {
    updateAvatar(null);
  };

  if (isLoading) {
    return <SettingsSkeleton />;
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

      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-40">
              <OptimizedAvatar
                src={avatar}
                alt="Profile Avatar"
                size="lg"
                priority={true}
                className="border-4"
              />
            </div>

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

          <TypedForm {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <TypedFormField
                control={profileForm.control}
                name="username"
                render={({ field }: { field: FieldType }) => (
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

              <TypedFormField
                control={profileForm.control}
                name="email"
                render={({ field }: { field: FieldType }) => (
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
          </TypedForm>
        </CardContent>
      </Card>

      <ChangePassword />
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
