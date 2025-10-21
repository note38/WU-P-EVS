"use client";

import CustomSignIn from "@/app/components/auth/custom-sign-in";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export default function SignInErrorHandler() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const { signOut } = useClerk();

  useEffect(() => {
    // Always ensure we start with a clean session when loading the sign-in page
    const clearSession = async () => {
      if (!error && !message) {
        try {
          // Clear any existing session to prevent stuck states
          await signOut();
        } catch (err) {
          console.log("Session already clear or error clearing session");
        }
      }
    };

    clearSession();
  }, [signOut, error, message]);

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
      <div className="mt-4">
        <CustomSignIn />
      </div>
    </div>
  );
}
