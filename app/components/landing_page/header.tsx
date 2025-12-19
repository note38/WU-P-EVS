"use client";

import { ThemeToggle } from "@/app/components/admin/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { memo, useCallback } from "react";

interface HeaderProps {
  onSwitchElection?: () => void;
}

export const Header = memo(function Header({ onSwitchElection }: HeaderProps) {
  const handleSwitchElection = useCallback(() => {
    onSwitchElection?.();
  }, [onSwitchElection]);

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
            WUP Voting System
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          <Button asChild size="sm" className="sm:size-default">
            <Link href="/sign-in" className="flex items-center gap-1 sm:gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
});
