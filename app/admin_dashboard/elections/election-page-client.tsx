"use client";

import { useElectionAutoStatus } from "@/hooks/use-election-auto-status";
import { ReactNode } from "react";

interface ElectionPageClientProps {
  children: ReactNode;
}

export function ElectionPageClient({ children }: ElectionPageClientProps) {
  // Enable automatic status checking for all elections
  useElectionAutoStatus({
    enabled: true,
    interval: 30000, // Check every 30 seconds
  });

  return <>{children}</>;
}
