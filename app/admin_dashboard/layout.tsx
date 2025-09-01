// This directive is essential for using Clerk hooks
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Import hooks from Clerk instead of next-auth
import { useAuth, useUser } from "@clerk/nextjs";
import { useClerkAuth } from "@/hooks/use-clerk-auth";

// Your custom hook and components
// import { useIdleTimeout } from "@/app/admin_dashboard/hooks/useIdleTimeout";
import { Header } from "@/app/components/admin/navigation/header";
import { Sidebar } from "@/app/components/admin/navigation/sidebar";
import { Footer } from "../components/admin/navigation/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use Clerk hooks to get auth state and user data
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const {
    user: databaseUser,
    isAdmin,
    isLoading: isUserLoading,
  } = useClerkAuth();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Route Protection ---
  // This effect will run when the component mounts and whenever the auth state changes.
  // It ensures that only authenticated users can access this layout.
  useEffect(() => {
    // Wait for Clerk to load its state
    if (isLoaded && !userId) {
      // If loading is complete and there's no user, redirect to the sign-in page
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  // Check if user is admin
  useEffect(() => {
    if (isLoaded && !isUserLoading && databaseUser && !isAdmin) {
      // If user is not admin, redirect to appropriate page
      router.push("/ballot");
    }
  }, [isLoaded, isUserLoading, databaseUser, isAdmin, router]);

  // --- Idle Timeout Hook ---
  // The hook is called unconditionally, as required by React.
  // The `isActive` prop now checks for the user role in Clerk's `publicMetadata`.
  // Note: You must set the user's role in your Clerk dashboard or via your backend.
  // const { isIdle } = useIdleTimeout({
  //   timeout: 18000000, // 5 hours in milliseconds
  //   isActive: user?.publicMetadata?.role === "ADMIN",
  // });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // --- Render Logic ---
  // While Clerk is checking the user's session, you can show a loading state.
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading Dashboard...</div>
      </div>
    );
  }

  // If the user is authenticated, render the full dashboard layout.
  if (userId) {
    return (
      <div className="flex flex-col h-screen lg:flex-row">
        {/* Mobile overlay for when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header onSidebarToggle={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // If the user is not authenticated and loading is complete, render nothing.
  // The useEffect hook will handle the redirect.
  return null;
}
