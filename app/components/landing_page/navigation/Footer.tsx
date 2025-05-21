"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row m-auto">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} WUP Voting System. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
