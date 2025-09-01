"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/app/components/admin/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icons
import { Bell, LogOut, Menu, User as UserIcon } from "lucide-react";

// Custom hook
import { useCustomSignOut } from "@/hooks/use-clerk-auth";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const router = useRouter();
  const { handleSignOut } = useCustomSignOut();
  // Get user data from Clerk's useUser hook
  const { user } = useUser();

  // This function gets the initials from the user's name for the avatar fallback
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // If the user data hasn't loaded yet, you can show a loading state or nothing
  if (!user) {
    return (
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-4">
          {/* You can add a loading skeleton here if you want */}
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-4">
        {/* Sidebar Toggle for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2"
          onClick={onSidebarToggle}
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />

          <Link href="/admin_dashboard/notifications">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
          </Link>

          {/* --- Your Custom Branded Dropdown --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {/* Use the user's image URL from Clerk */}
                  <AvatarImage
                    src={user.imageUrl}
                    alt={user.fullName || "User Avatar"}
                  />
                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.fullName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* This link should point to your user profile page */}
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/admin_dashboard/settings">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Manage Account</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* The signOut function from useClerk handles logging out */}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
