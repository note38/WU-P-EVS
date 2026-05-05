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
  onStatusUpdate?: (updates?: ElectionStatusUpdate[]) => void;
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
    if (isCheckingRef.current) {
      console.log("[USE-ELECTION-STATUS] Skipping check - already in progress");
      return; // Prevent concurrent checks
    }

    try {
      isCheckingRef.current = true;
      const startTime = new Date().toISOString();
      console.log("[USE-ELECTION-STATUS] Starting status check at", startTime);

      // First, check which elections need updates
      const checkResponse = await fetch("/api/elections/auto-status-update", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Accept: "application/json",
        },
      });

      // Handle 404 specifically
      if (checkResponse.status === 404) {
        console.warn(
          "[USE-ELECTION-STATUS] API endpoint /api/elections/auto-status-update not found. If you are using GitHub Actions, this is expected for the client hook."
        );
        return;
      }

      // Check if response is OK
      if (!checkResponse.ok) {
        const errorText = await checkResponse.clone().text();
        console.error(
          "[USE-ELECTION-STATUS] Status check failed:",
          checkResponse.status,
          checkResponse.statusText,
          errorText.substring(0, 100)
        );

        throw new Error(
          `Status check failed (${checkResponse.status}). See console for details.`
        );
      }

      // Try to parse JSON
      let checkData;
      try {
        checkData = await checkResponse.json();
      } catch (parseError) {
        console.error("[USE-ELECTION-STATUS] Failed to parse JSON response:", parseError);
        throw new Error("Invalid response from status check API");
      }

      console.log(
        "[USE-ELECTION-STATUS] Check completed. Elections needing update:",
        checkData.electionsNeedingUpdate?.length || 0
      );

      if (
        checkData.electionsNeedingUpdate &&
        checkData.electionsNeedingUpdate.length > 0
      ) {
        console.log("[USE-ELECTION-STATUS] Performing status updates...");
        const updateResponse = await fetch(
          "/api/elections/auto-status-update",
          {
            method: "POST",
            headers: {
              "Cache-Control": "no-cache",
              Accept: "application/json",
            },
          }
        );

        if (!updateResponse.ok) {
          console.error("[USE-ELECTION-STATUS] Update failed:", updateResponse.status);
          throw new Error(`Status update failed (${updateResponse.status})`);
        }

        const updateData = await updateResponse.json();
        console.log(
          "[USE-ELECTION-STATUS] Updates completed:",
          updateData.updatedElections?.length || 0,
          "elections updated"
        );

        // Notify about the updates
        if (
          updateData.updatedElections &&
          updateData.updatedElections.length > 0
        ) {
          const updatedNames = updateData.updatedElections
            .map((election: any) => `"${election.name}" → ${election.status}`)
            .join(", ");

          toast({
            title: "Election Status Updated",
            description: `Automatically updated: ${updatedNames}`,
            variant: "default",
          });

          // Call the callback if provided
          if (onStatusUpdateRef.current) {
            onStatusUpdateRef.current(checkData.electionsNeedingUpdate);
          }
        }
      } else {
        if (onStatusUpdateRef.current) {
          onStatusUpdateRef.current();
        }
      }

      const endTime = new Date().toISOString();
      console.log("[USE-ELECTION-STATUS] Status check finished at", endTime);
    } catch (error) {
      console.error(
        "[USE-ELECTION-STATUS] Error in automatic status update:",
        error
      );
      
      // Only show toast for non-404 errors to avoid spamming the UI
      if (error instanceof Error && !error.message.includes("404")) {
        toast({
          title: "Status Sync Warning",
          description: "Could not sync election statuses. Check console for details.",
          variant: "destructive",
        });
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [toast]); // Removed onStatusUpdate from dependencies to prevent recreation loop

  // Use ref to store the latest onStatusUpdate callback to avoid dependency issues
  const onStatusUpdateRef = useRef(onStatusUpdate);

  // Update ref when callback changes
  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  const startAutoCheck = useCallback(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      console.log("[USE-ELECTION-STATUS] Clearing existing interval");
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log(
      `[USE-ELECTION-STATUS] Starting auto-check with ${interval}ms interval`
    );

    // Run initial check immediately
    checkAndUpdateStatuses();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(() => {
      console.log("[USE-ELECTION-STATUS] Interval triggered");
      checkAndUpdateStatuses();
    }, interval);
  }, [checkAndUpdateStatuses, interval]);

  const stopAutoCheck = useCallback(() => {
    if (intervalRef.current) {
      console.log("[USE-ELECTION-STATUS] Stopping auto-check");
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
