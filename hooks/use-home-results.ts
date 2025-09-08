import { useState, useEffect } from "react";

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
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
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

export function useHomeResults(): UseHomeResultsReturn {
  const [elections, setElections] = useState<ElectionResult[]>([]);
  const [activeElection, setActiveElection] = useState<ElectionResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      setError(null);

      // Fetch all elections for home page
      const allResponse = await fetch("/api/home/elections");
      let allElections: ElectionResult[] = [];

      if (allResponse.ok) {
        allElections = await allResponse.json();
      } else if (allResponse.status === 404) {
        // 404 means no elections found, which is not an error
        console.log("📊 No elections found (404), using empty array");
        allElections = [];
      } else {
        // Other status codes are actual errors
        const errorData = await allResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch election results: ${errorData.details || errorData.error || allResponse.statusText}`
        );
      }

      // Fetch active/recent election for home page
      const activeResponse = await fetch("/api/home/elections?active=true");
      let activeElectionData: ElectionResult | null = null;

      if (activeResponse.ok) {
        activeElectionData = await activeResponse.json();
      } else if (activeResponse.status === 404) {
        // 404 means no active election found, which is not an error
        console.log("📊 No active election found (404), using null");
        activeElectionData = null;
      } else {
        // Other status codes are actual errors
        const errorData = await activeResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch active election: ${errorData.details || errorData.error || activeResponse.statusText}`
        );
      }

      setElections(allElections);
      setActiveElection(activeElectionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching home results:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPercentagesOnly = async () => {
    try {
      // Fetch only the latest vote counts for percentage calculation (home page)
      const allResponse = await fetch("/api/home/elections");
      let allElections: ElectionResult[] = [];

      if (allResponse.ok) {
        allElections = await allResponse.json();
      } else if (allResponse.status === 404) {
        // 404 means no elections found, continue with empty array
        allElections = [];
      } else {
        const errorData = await allResponse.json().catch(() => ({}));
        console.warn(
          "Percentage update failed:",
          errorData.details || errorData.error || allResponse.statusText
        );
        return; // Don't throw error for percentage updates
      }

      const activeResponse = await fetch("/api/home/elections?active=true");
      let activeElectionData: ElectionResult | null = null;

      if (activeResponse.ok) {
        activeElectionData = await activeResponse.json();
      } else if (activeResponse.status === 404) {
        // 404 means no active election found, continue with null
        activeElectionData = null;
      } else {
        const errorData = await activeResponse.json().catch(() => ({}));
        console.warn(
          "Active election update failed:",
          errorData.details || errorData.error || activeResponse.statusText
        );
        return; // Don't throw error for percentage updates
      }

      setElections(allElections);
      setActiveElection(activeElectionData);
    } catch (err) {
      console.error("Error fetching percentages:", err);
      // Don't set error state for percentage updates to avoid disrupting the UI
    }
  };

  useEffect(() => {
    fetchResults();

    // Set up polling for percentage updates every 10 seconds (faster for live feel)
    const interval = setInterval(fetchPercentagesOnly, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    elections,
    activeElection,
    loading,
    error,
    refetch: fetchResults,
    refetchPercentages: fetchPercentagesOnly,
  };
}
