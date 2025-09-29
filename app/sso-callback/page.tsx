"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";

function SSOCallbackContent() {
  const { handleRedirectCallback, user } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Completing sign-in process...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsChecking(true);
        setStatusMessage("Processing your sign-in...");

        // Handle the OAuth callback
        await handleRedirectCallback({
          redirectUrl: "/sso-callback",
        });

        setStatusMessage("Sign-in successful! Redirecting to dashboard...");
        
        // Small delay to show the success message
        await new Promise(resolve => setTimeout(resolve, 1000));

        // After successful callback, redirect to admin dashboard
        console.log("✅ SSO callback completed, redirecting to admin dashboard...");
        router.push("/admin_dashboard");
      } catch (error) {
        console.error("SSO callback error:", error);
        setStatusMessage("Sign-in failed");
        setError("An error occurred during sign-in. Please try again.");
      } finally {
        setIsChecking(false);
      }
    };

    handleCallback();
  }, [handleRedirectCallback, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign-in Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isChecking ? "Processing Sign-in" : "Redirecting"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {statusMessage}
        </p>
        <div className="mt-4">
          <div className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            Please wait while we complete the authentication process
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SSOCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Loading
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Initializing sign-in process...
            </p>
          </div>
        </div>
      }
    >
      <SSOCallbackContent />
    </Suspense>
  );
}