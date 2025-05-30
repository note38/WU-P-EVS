"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} WUP Voting System. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
