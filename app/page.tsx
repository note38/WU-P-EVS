"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { checkUserRole } from "@/action/auth";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      // Wait for Clerk to load
      if (!isLoaded) return;

      // If user is not authenticated, redirect to home page
      if (!userId) {
        console.log("🔀 Redirecting unauthenticated user to /home");
        router.push("/home");
        return;
      }

      console.log(`🔍 Checking user role for: ${userId}`);

      try {
        // Use server action to check user role
        const result = await checkUserRole(userId);

        if (result.success && result.userType) {
          console.log(`✅ User found as: ${result.userType}`);

          if (result.userType === "admin") {
            console.log("🔀 Redirecting admin to /admin_dashboard");
            router.push("/admin_dashboard");
          } else if (result.userType === "voter") {
            console.log("🔀 Redirecting voter to /ballot");
            router.push("/ballot");
          }
        } else {
          console.log(
            "⚠️ User not found in database, signing out and redirecting to home"
          );
          // Sign out the user since they're not in our database
          await signOut({ redirectUrl: "/home" });
        }
      } catch (error) {
        console.error("❌ Error checking user role:", error);
        // Sign out the user on error
        await signOut({ redirectUrl: "/home" });
      }
    };

    handleRedirect();
  }, [isLoaded, userId, router, signOut]);

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Redirecting...</p>
      </div>
    </div>
  );
}
