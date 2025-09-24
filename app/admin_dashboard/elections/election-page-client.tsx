"use client";

import { useElectionAutoStatus } from "@/hooks/use-election-auto-status";
import { ReactNode } from "react";

interface ElectionPageClientProps {
  children: ReactNode;
  onStatusUpdate?: () => void;
}

export function ElectionPageClient({ children, onStatusUpdate }: ElectionPageClientProps) {
  // Enable automatic status checking for all elections
  useElectionAutoStatus({
    enabled: true,
    interval: 60000, // Check every 60 seconds (1 minute) to reduce API load
    onStatusUpdate: onStatusUpdate,
  });

  return <>{children}</>;
}
