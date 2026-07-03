import { useState, useEffect, useRef } from "react";

interface Candidate {
  id: number;
  name: string;
  avatar: string | null;
  partylist: string;
  votes: number;
}

interface Position {
  id: number;
  name: string;
  candidates: Candidate[];
}

interface ElectionResult {
  id: number;
  name: string;
  status: "ACTIVE" | "COMPLETED";
  hideName?: boolean;
  totalVoters?: number;
  positions: Position[];
}

interface UseHomeResultsReturn {
  elections: ElectionResult[];
  activeElection: ElectionResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  refetchPercentages: () => void;
}

// ---------------------------------------------------------------------------
// Polling interval (ms).
// 60 000 ms = 1 minute  →  60× fewer ops than the old 10-second interval.
// During a live election day that's still fast enough for a school vote count.
// ---------------------------------------------------------------------------
const POLL_INTERVAL_MS = 60_000;

export function useHomeResults(): UseHomeResultsReturn {
  const [elections, setElections] = useState<ElectionResult[]>([]);
  const [activeElection, setActiveElection] = useState<ElectionResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep an interval ref so we can start/stop it without triggering re-renders
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -------------------------------------------------------------------------
  // Core fetch — calls both endpoints, parses results, updates state.
  // Both fetches run in parallel (Promise.all) to save time.
  // -------------------------------------------------------------------------
  const fetchResults = async (silent = false) => {
    try {
      if (!silent) setError(null);

      // Run both API calls in parallel — no need to wait for one before the other
      const [allResponse, activeResponse] = await Promise.all([
        fetch("/api/home/elections"),
        fetch("/api/home/elections?active=true"),
      ]);

      // --- All elections ---
      let allElections: ElectionResult[] = [];
      if (allResponse.ok) {
        allElections = await allResponse.json();
      } else if (allResponse.status !== 404) {
        const errorData = await allResponse.json().catch(() => ({}));
        if (!silent) {
          throw new Error(
            `Failed to fetch election results: ${
              errorData?.details || errorData?.error || allResponse.statusText
            }`
          );
        } else {
          console.warn("Percentage update (all elections) failed:", errorData);
          return;
        }
      }

      // --- Active election ---
      let activeElectionData: ElectionResult | null = null;
      if (activeResponse.ok) {
        activeElectionData = await activeResponse.json();
      } else if (activeResponse.status !== 404) {
        const errorData = await activeResponse.json().catch(() => ({}));
        if (!silent) {
          throw new Error(
            `Failed to fetch active election: ${
              errorData?.details || errorData?.error || activeResponse.statusText
            }`
          );
        } else {
          console.warn("Percentage update (active election) failed:", errorData);
          return;
        }
      }

      setElections(allElections);
      setActiveElection(activeElectionData);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching home results:", err);
      } else {
        console.error("Error fetching percentages (silent):", err);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Interval management helpers
  // -------------------------------------------------------------------------
  const startInterval = () => {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => {
      // Only poll if the tab is visible — saves ops when user switches tabs
      if (!document.hidden) {
        fetchResults(true /* silent = don't show loading spinner */);
      }
    }, POLL_INTERVAL_MS);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // -------------------------------------------------------------------------
  // Mount: initial fetch + start polling + visibility listener
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Initial full load
    fetchResults(false);

    // Start the polling interval
    startInterval();

    // Pause polling when the user switches away from the tab,
    // resume when they come back and immediately re-fetch so data is fresh.
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        // Tab became visible again — fetch immediately then restart interval
        fetchResults(true);
        startInterval();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    elections,
    activeElection,
    loading,
    error,
    refetch: () => fetchResults(false),
    refetchPercentages: () => fetchResults(true),
  };
}
