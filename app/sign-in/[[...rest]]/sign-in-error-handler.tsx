"use client";

import CustomSignIn from "@/app/components/auth/custom-sign-in";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function SignInErrorHandler() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  useEffect(() => {
    if (error && message) {
      // Show error message as toast
      toast({
        title: "Access Denied",
        description: decodeURIComponent(message),
        variant: "destructive",
      });
    }
  }, [error, message]);

  return (
    <div className="space-y-4">
      {error === 'email_not_registered' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email Not Registered</AlertTitle>
          <AlertDescription>
            The email you used is not registered in our voting system. 
            Please try with a different email or contact an administrator for access.
          </AlertDescription>
        </Alert>
      )}
      <CustomSignIn />
    </div>
  );
}