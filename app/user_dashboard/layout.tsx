"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Header } from "@/app/components/user/header";
import { Sidebar } from "@/app/components/user/sidebar";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session.user?.role !== "USER") {
      router.push("/");
    }
  }, [session, status, router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && session.user?.role === "USER") {
    return (
      <div className="flex flex-col h-screen lg:flex-row">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header onSidebarToggle={toggleSidebar} />
          <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
        </div>
      </div>
    );
  }

  return null;
}
