"use client";

import CustomSignIn from "@/app/components/auth/custom-sign-in";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { useClerk, useAuth } from "@clerk/nextjs";

export default function SignInErrorHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const redirectUrl = searchParams.get("redirect_url");
  const { signOut } = useClerk();
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  // Handle redirect_url parameter properly
  useEffect(() => {
    if (redirectUrl) {
      try {
        // Decode the redirect URL if it's encoded
        const decodedRedirectUrl = decodeURIComponent(redirectUrl);
        // Validate that it's a relative URL (for security)
        if (decodedRedirectUrl.startsWith("/")) {
          // Store the intended redirect URL in localStorage for use after authentication
          if (typeof window !== "undefined") {
            localStorage.setItem("intendedRedirectUrl", decodedRedirectUrl);
            console.log("Stored intended redirect URL:", decodedRedirectUrl);
          }
        }
      } catch (e) {
        console.error("Error decoding redirect URL:", e);
      }
    }
  }, [redirectUrl]);

  useEffect(() => {
    // If user is already signed in, redirect them to their intended destination
    if (isSignedIn && userId) {
      // Check if there's an intended redirect URL stored in localStorage
      let intendedRedirectUrl = null;
      if (typeof window !== "undefined") {
        intendedRedirectUrl = localStorage.getItem("intendedRedirectUrl");
        if (intendedRedirectUrl) {
          // Remove the stored redirect URL
          localStorage.removeItem("intendedRedirectUrl");
          console.log(
            "Found intended redirect URL for already signed-in user:",
            intendedRedirectUrl
          );

          // Validate that it's a relative URL (for security)
          if (intendedRedirectUrl.startsWith("/")) {
            console.log(
              ".Redirecting already signed-in user to intended URL:",
              intendedRedirectUrl
            );
            // Use window.location.replace for immediate redirect
            window.location.replace(intendedRedirectUrl);
            return;
          }
        }
      }

      // If no intended redirect URL, redirect to dashboard redirect page for proper handling
      console.log(
        "Redirecting already signed-in user to dashboard redirect page"
      );
      window.location.replace("/dashboard-redirect");
    }

    // Clear session only if there are no errors, messages, or redirect URLs
    // AND the user is not already signed in
    // const clearSession = async () => {
    //   if (!isSignedIn && !error && !message && !redirectUrl) {
    //     try {
    //       // Clear any existing session to prevent stuck states
    //       await signOut();
    //       console.log("Session cleared");
    //     } catch (err) {
    //       console.log("Session already clear or error clearing session");
    //     }
    //   } else {
    //     console.log("Skipping session clear because:", {
    //       isSignedIn,
    //       error,
    //       message,
    //       redirectUrl,
    //     });
    //   }
    // };

    // clearSession();
  }, [
    signOut,
    error,
    message,
    redirectUrl,
    isSignedIn,
    userId,
    isCheckingSession,
    router,
  ]);

  return (
    <div className="w-full max-w-md space-y-6">
      {error === "email_not_registered" && (
        <Alert variant="destructive" className="text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email Not Registered</AlertTitle>
          <AlertDescription>
            The email you used is not registered in our voting system. Please
            try with a different email or contact an administrator for access.
          </AlertDescription>
        </Alert>
      )}
      {error === "session_validation_failed" && (
        <Alert variant="destructive" className="text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Session Validation Failed</AlertTitle>
          <AlertDescription>
            {message ||
              "There was an issue validating your session. Please try signing in again."}
          </AlertDescription>
        </Alert>
      )}
      {error === "session_required" && (
        <Alert variant="destructive" className="text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Session Required</AlertTitle>
          <AlertDescription>
            {message || "Please sign in to continue."}
          </AlertDescription>
        </Alert>
      )}
      {/* Show general error message if present */}
      {error &&
        error !== "email_not_registered" &&
        error !== "session_validation_failed" &&
        error !== "session_required" && (
          <Alert variant="destructive" className="text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sign-in Error</AlertTitle>
            <AlertDescription>
              {message || "An error occurred during sign-in. Please try again."}
            </AlertDescription>
          </Alert>
        )}
      {!error && !message && (
        <Alert className="text-left">
          <Info className="h-4 w-4" />
          <AlertTitle>Welcome</AlertTitle>
          <AlertDescription>
            Please sign in with your registered email address or use Google
            authentication.
          </AlertDescription>
        </Alert>
      )}
      <div className="mt-4">
        <CustomSignIn />
      </div>
    </div>
  );
}
