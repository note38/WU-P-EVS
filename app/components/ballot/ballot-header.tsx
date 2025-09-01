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
import { LogOut, User as UserIcon } from "lucide-react";

// Custom hook
import { useCustomSignOut } from "@/hooks/use-clerk-auth";

export function BallotHeader() {
  const router = useRouter();
  const { handleSignOut } = useCustomSignOut();
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

  // If the user data hasn't loaded yet, show a loading state
  if (!user) {
    return (
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/wup-logo.png"
              className="h-14 w-auto"
              alt="AWUP Logo"
              loading="eager"
              decoding="sync"
            />
            <h1 className="text-xl font-bold hidden sm:block">
              AWUP Voting System
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/wup-logo.png"
            className="h-14 w-auto"
            alt="AWUP Logo"
            loading="eager"
            decoding="sync"
          />
          <h1 className="text-xl font-bold hidden sm:block">
            AWUP Voting System
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
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
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/user-profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Manage Account</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
