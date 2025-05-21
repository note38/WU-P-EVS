"use client";

import React from "react";
import Link from "next/link";
import { LogIn, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSwitchElection?: () => void;
}

export function Header({ onSwitchElection }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between m-auto ">
        <div className="flex items-center gap-2">
          <img src="/wup-logo.png" className="h-14 w-auto" />
          <h1 className="text-xl font-bold">AWUP Voting System</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onSwitchElection}>
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
}
