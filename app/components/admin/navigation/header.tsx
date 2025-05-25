"use client";

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
import { Bell, Loader2, Menu, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUserAvatar } from "@/hooks/use-user-avatar";

interface HeaderProps {
  onSidebarToggle: () => void;
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { avatar } = useUserAvatar();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering session-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut({ redirect: false });
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get initials from name
  const getInitials = (name?: string | null) => {
    if (!name) return "UN";
    const names = name.split(" ");
    return names
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-4">
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
          <Link href="/admin_dashboard/notifications" legacyBehavior passHref>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
          </Link>
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatar || undefined} alt="User Avatar" />
                    <AvatarFallback>
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 " align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email || "No email"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin_dashboard/settings"
                    className="flex items-center gap-2 w-full"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <span>Log out</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!mounted && (
            // Placeholder to prevent layout shift
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
              disabled
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
