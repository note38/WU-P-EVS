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
      console.log('[USE-ELECTION-STATUS] Skipping check - already in progress');
      return; // Prevent concurrent checks
    }

    try {
      isCheckingRef.current = true;
      console.log('[USE-ELECTION-STATUS] Starting status check at', new Date().toISOString());

      // First, check which elections need updates
      const checkResponse = await fetch("/api/elections/auto-status-update", {
        method: "GET",
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!checkResponse.ok) {
        const errorText = await checkResponse.text();
        console.error('[USE-ELECTION-STATUS] Check failed:', checkResponse.status, errorText);
        throw new Error(`Failed to check election statuses: ${checkResponse.status} ${checkResponse.statusText}`);
      }

      const checkData = await checkResponse.json();
      console.log('[USE-ELECTION-STATUS] Check completed, elections needing update:', checkData.electionsNeedingUpdate?.length || 0);

      if (
        checkData.electionsNeedingUpdate &&
        checkData.electionsNeedingUpdate.length > 0
      ) {
        console.log('[USE-ELECTION-STATUS] Performing status updates...');
        // If there are elections that need updates, perform the updates
        const updateResponse = await fetch(
          "/api/elections/auto-status-update",
          {
            method: "POST",
            headers: {
              'Cache-Control': 'no-cache',
            },
          }
        );

        if (!updateResponse.ok) {
          console.error('[USE-ELECTION-STATUS] Update failed:', updateResponse.status);
          throw new Error("Failed to update election statuses");
        }

        const updateData = await updateResponse.json();
        console.log('[USE-ELECTION-STATUS] Updates completed:', updateData.updatedElections?.length || 0, 'elections');

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
    } catch (error) {
      console.error("[USE-ELECTION-STATUS] Error in automatic status update:", error);
      // Don't show toast for errors to avoid spam, just log them
    } finally {
      isCheckingRef.current = false;
      console.log('[USE-ELECTION-STATUS] Status check completed at', new Date().toISOString());
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
      console.log('[USE-ELECTION-STATUS] Clearing existing interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log(`[USE-ELECTION-STATUS] Starting auto-check with ${interval}ms interval`);
    
    // Run initial check immediately
    checkAndUpdateStatuses();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(() => {
      console.log('[USE-ELECTION-STATUS] Interval triggered');
      checkAndUpdateStatuses();
    }, interval);
  }, [checkAndUpdateStatuses, interval]);

  const stopAutoCheck = useCallback(() => {
    if (intervalRef.current) {
      console.log('[USE-ELECTION-STATUS] Stopping auto-check');
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
