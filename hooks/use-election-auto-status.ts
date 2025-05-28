"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface ElectionStatusUpdate {
  id: number;
  name: string;
  currentStatus: string;
  suggestedStatus: string;
  startDate: string;
  endDate: string;
}

interface UseElectionAutoStatusOptions {
  enabled?: boolean;
  interval?: number; // in milliseconds, default 60000 (1 minute)
  onStatusUpdate?: (updates: ElectionStatusUpdate[]) => void;
}

export function useElectionAutoStatus(
  options: UseElectionAutoStatusOptions = {}
) {
  const {
    enabled = true,
    interval = 60000, // 1 minute
    onStatusUpdate,
  } = options;

  const router = useRouter();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  const checkAndUpdateStatuses = useCallback(async () => {
    if (isCheckingRef.current) return; // Prevent concurrent checks

    try {
      isCheckingRef.current = true;

      // First, check which elections need updates
      const checkResponse = await fetch("/api/elections/auto-status-update", {
        method: "GET",
      });

      if (!checkResponse.ok) {
        throw new Error("Failed to check election statuses");
      }

      const checkData = await checkResponse.json();

      if (checkData.count > 0) {
        // If there are elections that need updates, perform the updates
        const updateResponse = await fetch(
          "/api/elections/auto-status-update",
          {
            method: "POST",
          }
        );

        if (!updateResponse.ok) {
          throw new Error("Failed to update election statuses");
        }

        const updateData = await updateResponse.json();

        // Notify about the updates
        if (updateData.updatedElections.length > 0) {
          const updatedNames = updateData.updatedElections
            .map((election: any) => `"${election.name}" → ${election.status}`)
            .join(", ");

          toast({
            title: "Election Status Updated",
            description: `Automatically updated: ${updatedNames}`,
            variant: "default",
          });

          // Call the callback if provided
          if (onStatusUpdate) {
            onStatusUpdate(checkData.electionsNeedingUpdate);
          }

          // Refresh the page to show updated statuses
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error in automatic status update:", error);
      // Don't show toast for errors to avoid spam, just log them
    } finally {
      isCheckingRef.current = false;
    }
  }, [router, toast, onStatusUpdate]);

  const startAutoCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Run initial check
    checkAndUpdateStatuses();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(checkAndUpdateStatuses, interval);
  }, [checkAndUpdateStatuses, interval]);

  const stopAutoCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const manualCheck = useCallback(() => {
    return checkAndUpdateStatuses();
  }, [checkAndUpdateStatuses]);

  useEffect(() => {
    if (enabled) {
      startAutoCheck();
    } else {
      stopAutoCheck();
    }

    return () => {
      stopAutoCheck();
    };
  }, [enabled, startAutoCheck, stopAutoCheck]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoCheck();
    };
  }, [stopAutoCheck]);

  return {
    manualCheck,
    startAutoCheck,
    stopAutoCheck,
  };
}
