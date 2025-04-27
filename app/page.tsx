"use client";

import LoginForm from "@/app/auth/LoginForm";
import BackgroundPaths from "@/components/ui/backgound-paths";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PuffLoader } from "react-spinners";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      // Redirect based on user role
      if (session.user?.role === "ADMIN") {
        router.push("/admin_dashboard");
      } else if (session.user?.role === "USER") {
        router.push("/user_dashboard");
      }
    }
  }, [session, status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <PuffLoader color="#002aff" size={60} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      {/* Background with green paths */}
      <BackgroundPaths />

      {/* Login form with proper z-index to appear above the background */}
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
