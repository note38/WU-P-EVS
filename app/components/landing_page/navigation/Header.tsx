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
      <div className="container flex h-16 items-center justify-between m-auto ">
        <div className="flex items-center gap-2">
          <img
            src="/wup-logo.png"
            className="h-14 w-auto"
            alt="AWUP Logo"
            loading="eager"
            decoding="sync"
          />
          <h1 className="text-xl font-bold">AWUP Voting System</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" onClick={handleSwitchElection}>
            Switch Election
          </Button>
          <Button asChild>
            <Link href="/login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
});
