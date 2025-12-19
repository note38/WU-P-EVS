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
          "[USE-ELECTION-STATUS] API endpoint not found, skipping check"
        );
        return;
      }

      // Check if response is OK
      if (!checkResponse.ok) {
        const errorText = await checkResponse.clone().text();
        console.error(
          "[USE-ELECTION-STATUS] Check failed:",
          checkResponse.status,
          errorText
        );

        // Check if response is HTML (error page)
        if (
          errorText.startsWith("<!DOCTYPE") ||
          errorText.startsWith("<html")
        ) {
          console.error(
            "[USE-ELECTION-STATUS] API returned HTML instead of JSON - likely an error page"
          );
          throw new Error(
            `API returned HTML instead of JSON: ${checkResponse.status} ${checkResponse.statusText}`
          );
        }

        throw new Error(
          `Failed to check election statuses: ${checkResponse.status} ${checkResponse.statusText}`
        );
      }

      // Try to parse JSON, but catch parsing errors
      let checkData;
      try {
        checkData = await checkResponse.json();
      } catch (parseError) {
        const responseText = await checkResponse.clone().text();
        console.error(
          "[USE-ELECTION-STATUS] Failed to parse JSON response:",
          parseError,
          "Response text:",
          responseText.substring(0, 200) +
            (responseText.length > 200 ? "..." : "")
        );

        // Check if response is HTML (error page)
        if (
          responseText.startsWith("<!DOCTYPE") ||
          responseText.startsWith("<html")
        ) {
          throw new Error("API returned HTML instead of JSON");
        }

        throw new Error("Failed to parse API response as JSON");
      }

      console.log(
        "[USE-ELECTION-STATUS] Check completed, elections needing update:",
        checkData.electionsNeedingUpdate?.length || 0
      );

      if (
        checkData.electionsNeedingUpdate &&
        checkData.electionsNeedingUpdate.length > 0
      ) {
        console.log("[USE-ELECTION-STATUS] Performing status updates...");
        // If there are elections that need updates, perform the updates
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

        // Handle 404 specifically
        if (updateResponse.status === 404) {
          console.warn(
            "[USE-ELECTION-STATUS] API endpoint not found, skipping update"
          );
          return;
        }

        // Check if response is OK
        if (!updateResponse.ok) {
          console.error(
            "[USE-ELECTION-STATUS] Update failed:",
            updateResponse.status
          );
          throw new Error("Failed to update election statuses");
        }

        // Try to parse JSON, but catch parsing errors
        let updateData;
        try {
          updateData = await updateResponse.json();
        } catch (parseError) {
          const responseText = await updateResponse.clone().text();
          console.error(
            "[USE-ELECTION-STATUS] Failed to parse JSON response:",
            parseError,
            "Response text:",
            responseText.substring(0, 200) +
              (responseText.length > 200 ? "..." : "")
          );

          // Check if response is HTML (error page)
          if (
            responseText.startsWith("<!DOCTYPE") ||
            responseText.startsWith("<html")
          ) {
            throw new Error("API returned HTML instead of JSON");
          }

          throw new Error("Failed to parse API response as JSON");
        }

        console.log(
          "[USE-ELECTION-STATUS] Updates completed:",
          updateData.updatedElections?.length || 0,
          "elections"
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
        // Call the callback even when no updates are needed (to notify that check completed)
        if (onStatusUpdateRef.current) {
          onStatusUpdateRef.current();
        }
      }

      const endTime = new Date().toISOString();
      console.log("[USE-ELECTION-STATUS] Status check completed at", endTime);
    } catch (error) {
      console.error(
        "[USE-ELECTION-STATUS] Error in automatic status update:",
        error
      );
      // Don't show toast for errors to avoid spam, just log them
      // Only show toast for significant errors, not for 404s
      if (error instanceof Error && !error.message.includes("404")) {
        toast({
          title: "Auto Status Update Error",
          description:
            "Failed to automatically update election statuses. Please check the console for details.",
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
