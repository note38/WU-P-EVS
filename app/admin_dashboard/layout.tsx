"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Sidebar } from "@/app/components/admin/navigation/sidebar";
import { Header } from "@/app/components/admin/navigation/header";
import { useIdleTimeout } from "@/app/admin_dashboard/hooks/useIdleTimeout";
import { useSession } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Always call the hook, but conditionally activate it inside
  const { isIdle } = useIdleTimeout({
    timeout: 300000, // 5 hours
    isActive: session?.user?.role === "ADMIN",
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

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
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
