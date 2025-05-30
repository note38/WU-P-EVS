"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProfileSkeleton() {
  return (
    <Card className="min-h-[300px]">
      <CardHeader>
        <div className="space-y-2">
          <div className="h-7 w-24 bg-muted rounded animate-pulse" />
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          {/* Avatar Section */}
          <div className="space-y-4">
            <div className="h-40 w-40 rounded-full bg-muted animate-pulse" />
            <div className="flex items-center justify-center gap-2">
              <div className="h-9 w-32 bg-muted rounded animate-pulse" />
              <div className="h-9 w-20 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>

          {/* Form Section */}
          <div className="w-full max-w-sm space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <div className="h-5 w-14 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            </div>

            {/* Submit Button */}
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PasswordSkeleton() {
  return (
    <Card className="min-h-[250px]">
      <CardHeader>
        <div className="space-y-2">
          <div className="h-7 w-24 bg-muted rounded animate-pulse" />
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full max-w-sm space-y-6">
          {/* Current Password Field */}
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>

          {/* New Password Field */}
          <div className="space-y-2">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>

          {/* Submit Button */}
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 space-y-6">
      <ProfileSkeleton />
      <PasswordSkeleton />
    </div>
  );
}
