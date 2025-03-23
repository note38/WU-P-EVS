"use client";

import LoginForm from "@/app/auth/LoginForm";
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">WU-P EVS</h1>
        <LoginForm />
      </div>
    </div>
  );
}
