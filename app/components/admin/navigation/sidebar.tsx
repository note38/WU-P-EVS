"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  LayoutDashboardIcon,
  Settings,
  User,
  Vote,
  X,
  Bell,
} from "lucide-react";

const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboardIcon, href: "/admin_dashboard" },
  { name: "Elections", icon: Vote, href: "/admin_dashboard/elections" },
  { name: "Voters", icon: User, href: "/admin_dashboard/voters" },
  {
    name: "Notifications",
    icon: Bell,
    href: "/admin_dashboard/notifications",
  },
  {
    name: "System Settings",
    icon: Settings,
    href: "/admin_dashboard/settings",
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering navigation until mounted
  if (!mounted) {
    return (
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } lg:block fixed inset-y-0 left-0 z-50 w-64 bg-card border-r lg:relative`}
      >
        <div className="flex items-center justify-between p-4">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/wup-logo.png" className="h-14 w-auto" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              WUP EVS
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <nav className="flex-1 px-4 space-y-1">
            {sidebarItems.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-foreground hover:bg-accent"
                >
                  <IconComponent className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div
      className={`${
        isOpen ? "block" : "hidden"
      } lg:block fixed inset-y-0 left-0 z-50 w-64 bg-card border-r lg:relative`}
    >
      <div className="flex items-center justify-between p-4">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/wup-logo.png" className="h-14 w-auto" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            WUP EVS
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map((link) => {
            const isActive = pathname === link.href;
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <IconComponent className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
