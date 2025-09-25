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

      // If user is not authenticated, redirect to home page (public landing page)
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
            "⚠️ User not found in database, signing out and redirecting to sign-in"
          );
          
          // Clear the session and redirect to sign-in with error
          try {
            await signOut();
          } catch (signOutError) {
            console.error("Error during sign out:", signOutError);
          }
          
          // Redirect to sign-in with error message
          router.push(
            "/sign-in?error=email_not_registered&message=This email is not registered in our system. Please try with a different email or contact an administrator."
          );
        }
      } catch (err) {
        console.error("Error checking user role:", err);
        // On error, still redirect to sign-in to avoid getting stuck
        try {
          await signOut();
        } catch (signOutError) {
          console.error("Error during sign out:", signOutError);
        }
        router.push("/sign-in");
      }
    };

    handleRedirect();
  }, [isLoaded, userId, router, signOut]);

  return null;
}