"use client";

import CustomSignIn from "@/app/components/auth/custom-sign-in";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";

export default function SignInErrorHandler() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <div className="w-full max-w-md space-y-6">
      {error === "email_not_registered" && (
        <Alert variant="destructive" className="text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email Not Registered</AlertTitle>
          <AlertDescription>
            The email you used is not registered in our voting system. Please
            contact an administrator to be added to the system.
          </AlertDescription>
        </Alert>
      )}

      {error && message && error !== "email_not_registered" && (
        <Alert variant="destructive" className="text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {message && !error && (
        <Alert className="text-left">
          <Info className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <CustomSignIn />
    </div>
  );
}