"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { checkUserRole } from "@/action/auth";

export default function DashboardRedirectPage() {
  const { isLoaded, userId, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const hasRedirected = useRef(false);
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    const handleRedirect = async () => {
      console.log("🔄 Dashboard redirect check:", {
        isLoaded,
        userId,
        isSignedIn,
      });

      // Wait for Clerk to load
      if (!isLoaded) {
        console.log("⏳ Waiting for Clerk to load...");
        return;
      }

      // If user is not signed in, redirect to home immediately
      if (!isSignedIn || !userId) {
        console.log("🔀 Redirecting unauthenticated user to /home");
        hasRedirected.current = true;
        router.push("/home");
        return;
      }

      console.log(`🔍 Checking user role for: ${userId}`);

      try {
        // Use server action to check user role
        const result = await checkUserRole(userId || null);

        if (result.success && result.userType) {
          console.log(`✅ User found as: ${result.userType}`);

          // Check if there's an intended redirect URL stored in localStorage
          let intendedRedirectUrl = null;
          if (typeof window !== "undefined") {
            intendedRedirectUrl = localStorage.getItem("intendedRedirectUrl");
            if (intendedRedirectUrl) {
              // Remove the stored redirect URL
              localStorage.removeItem("intendedRedirectUrl");
              console.log("Found intended redirect URL:", intendedRedirectUrl);

              // Validate that it's a relative URL (for security)
              if (intendedRedirectUrl.startsWith("/")) {
                console.log(
                  "🔀 Redirecting to intended URL:",
                  intendedRedirectUrl
                );
                hasRedirected.current = true;
                // Use window.location.replace for a cleaner redirect
                window.location.replace(intendedRedirectUrl);
                return;
              }
            }
          }

          // Default redirects based on user type
          if (result.userType === "admin") {
            console.log("🔀 Redirecting admin to /admin_dashboard");
            hasRedirected.current = true;
            window.location.replace("/admin_dashboard");
          } else if (result.userType === "voter") {
            console.log("🔀 Redirecting voter to /ballot");
            hasRedirected.current = true;
            window.location.replace("/ballot");
          } else {
            console.log("⚠️ Unknown user type, redirecting to home");
            hasRedirected.current = true;
            window.location.replace("/home");
          }
        } else {
          console.log(
            "⚠️ User not found in database, signing out and redirecting to sign-in with error"
          );

          // Sign out the user first to break the authentication loop
          await signOut();

          // Redirect to sign-in with error message
          hasRedirected.current = true;
          window.location.replace(
            "/sign-in?error=email_not_registered&message=This email is not registered in our system. Please try with a different email or contact an administrator."
          );
        }
      } catch (err) {
        console.error("Error checking user role:", err);
        // On error, sign out and redirect to sign-in to avoid getting stuck
        try {
          await signOut();
        } catch (signOutErr) {
          console.error("Error signing out:", signOutErr);
        }
        hasRedirected.current = true;
        window.location.replace("/sign-in");
      } finally {
        setChecked(true);
      }
    };

    // Handle redirect immediately if we have all the data
    if (isLoaded && isSignedIn && userId) {
      handleRedirect();
    } else if (isLoaded && (!isSignedIn || !userId)) {
      // If loaded but not signed in, redirect to home
      console.log("🔀 Redirecting unauthenticated user to /home");
      hasRedirected.current = true;
      router.push("/home");
    } else {
      // Add a small delay before handling redirect to ensure Clerk is fully initialized
      redirectTimeout.current = setTimeout(handleRedirect, 200);
    }
  }, [isLoaded, userId, isSignedIn, router, signOut]);

  // Show loading state while checking
  if (!checked && !hasRedirected.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg font-medium">Redirecting...</p>
          <p className="text-muted-foreground">
            Please wait while we redirect you to the appropriate dashboard
          </p>
        </div>
      </div>
    );
  }

  // If for some reason we're still here, show a simple redirecting message
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-lg font-medium">Redirecting...</p>
        <p className="text-muted-foreground">
          Please wait while we redirect you to the appropriate dashboard
        </p>
      </div>
    </div>
  );
}
