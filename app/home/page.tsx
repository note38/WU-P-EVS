"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import {
  lazy,
  memo,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHomeResults } from "@/hooks/use-home-results";
import { UserAvatarSvg } from "@/app/components/ui/user-avatar-svg";
import { useElectionAutoStatus } from "@/hooks/use-election-auto-status";
import { useToast } from "@/hooks/use-toast";

// Critical path optimization - only load what's needed for first paint
const Header = dynamic(
  () =>
    import("../components/landing_page/header").then((mod) => ({
      default: mod.Header,
    })),
  {
    loading: () => (
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur h-16">
        <div className="max-w-6xl mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-14 w-14 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    ),
  }
);

// Lazy load Footer (below the fold) - defer until needed
const LazyFooter = lazy(() =>
  import("../components/landing_page/footer").then((module) => ({
    default: module.Footer,
  }))
);

// Critical CSS inlined styles for above-the-fold content
const criticalStyles = `
  .critical-layout {
    display: flex;
    min-height: 100vh;
    flex-direction: column;
  }
  .critical-main {
    flex: 1;
    max-width: 90rem;
    margin: 0 auto;
    padding: 2rem;
  }
  .critical-grid-mobile {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: 1024px) {
    .critical-grid-mobile {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 2rem;
    }
  }
  @media (min-width: 1280px) {
    .critical-main {
      padding: 3rem;
    }
  }
  .critical-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// Optimized avatar function with WebP support and preload hints
const getOptimizedAvatar = (name: string, priority = false) => {
  const cleanName = name.replace(/\s+/g, "+");
  const baseUrl = `https://ui-avatars.com/api/?name=${cleanName}&size=128&background=random&format=svg`;

  // Add preload hint for critical avatars
  if (priority && typeof window !== "undefined") {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = baseUrl;
    document.head.appendChild(link);
  }

  return baseUrl;
};

// Function to generate anonymous avatar when names are hidden
function getAnonymousAvatar(candidateId: number) {
  const styles = ["bottts", "identicon", "shapes"];
  const style = styles[candidateId % styles.length];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=anonymous-${candidateId}`;
}

// Static election data to prevent layout shift
const STATIC_ELECTIONS = [
  {
    id: "student-council-2024",
    name: "Student Council Election 2024",
    date: "May 15, 2024",
    status: "active" as const,
    description: "Election for student council positions.",
    positions: [
      {
        title: "President",
        candidates: [
          {
            id: 1,
            name: "Alex Johnson",
            votes: 89,
            percentage: 52,
            avatarUrl: getOptimizedAvatar("Alex Johnson", true),
          },
          {
            id: 2,
            name: "Sam Williams",
            votes: 82,
            percentage: 48,
            avatarUrl: getOptimizedAvatar("Sam Williams", true),
          },
        ],
        totalVotes: 171,
      },
      {
        title: "Vice President",
        candidates: [
          {
            id: 3,
            name: "Taylor Smith",
            votes: 95,
            percentage: 58,
            avatarUrl: getOptimizedAvatar("Taylor Smith"),
          },
          {
            id: 4,
            name: "Jordan Lee",
            votes: 69,
            percentage: 42,
            avatarUrl: getOptimizedAvatar("Jordan Lee"),
          },
        ],
        totalVotes: 164,
      },
    ],
  },
  {
    id: "club-officers-2024",
    name: "Club Officers Election 2024",
    date: "April 10, 2024",
    status: "completed" as const,
    description: "Election for club officer positions.",
    positions: [
      {
        title: "Science Club President",
        candidates: [
          {
            id: 5,
            name: "Casey Brown",
            votes: 76,
            percentage: 61,
            avatarUrl: getOptimizedAvatar("Casey Brown"),
          },
          {
            id: 6,
            name: "Riley Davis",
            votes: 49,
            percentage: 39,
            avatarUrl: getOptimizedAvatar("Riley Davis"),
          },
        ],
        totalVotes: 125,
      },
    ],
  },
];

function getStatusColor(status: "active" | "completed" | "upcoming") {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "completed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "upcoming":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

interface LiveCandidate {
  id: number;
  name: string;
  avatar: string | null;
  partylist: string;
  votes: number;
}

interface LivePosition {
  id: number;
  name: string;
  candidates: LiveCandidate[];
}

interface LiveElection {
  id: number;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  positions: LivePosition[];
}

interface TransformedElection {
  id: string;
  name: string;
  date: string;
  status: "active" | "completed" | "upcoming";
  description: string;
  positions: Array<{
    title: string;
    candidates: Array<{
      id: number;
      name: string;
      votes: number;
      avatarUrl: string;
      percentage: number;
    }>;
    totalVotes: number;
  }>;
}

// Skeleton component for loading states
const CandidateCardSkeleton = memo(() => (
  <Card className="overflow-hidden">
    <CardContent className="p-3 lg:p-6">
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="h-8 w-8 lg:h-16 lg:w-16 rounded-full bg-gray-200 critical-skeleton flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 lg:h-5 bg-gray-200 rounded critical-skeleton w-24 lg:w-32 mb-1"></div>
          <div className="h-4 lg:h-5 bg-gray-200 rounded critical-skeleton w-12 lg:w-16"></div>
        </div>
      </div>
    </CardContent>
  </Card>
));

// Optimized CandidateCard with better loading
const CandidateCard = memo(function CandidateCard({
  candidate,
  index,
  isUpdatingPercentages,
  showNames = true,
}: {
  candidate: TransformedElection["positions"][0]["candidates"][0];
  index: number;
  isUpdatingPercentages: boolean;
  showNames?: boolean;
}) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-3 lg:p-6">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="relative h-8 w-8 lg:h-16 lg:w-16 overflow-hidden rounded-full border flex-shrink-0">
            {showNames && candidate.avatarUrl ? (
              <img
                src={candidate.avatarUrl}
                alt={showNames ? candidate.name : "Anonymous"}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserAvatarSvg
                name={showNames ? candidate.name : "Anonymous"}
                size={64}
                hideName={!showNames}
                className="h-full w-full"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {showNames && (
              <h3 className="text-sm lg:text-lg font-semibold text-foreground mb-0.5 truncate">
                {candidate.name}
              </h3>
            )}
            <p
              className={`text-base lg:text-xl font-bold text-primary transition-all duration-200 ${
                isUpdatingPercentages ? "animate-pulse" : ""
              }`}
            >
              {candidate.percentage}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Other components remain the same but with performance optimizations
const ElectionSelector = memo(function ElectionSelector({
  elections,
  currentElection,
  onElectionChange,
}: {
  elections: TransformedElection[];
  currentElection: TransformedElection;
  onElectionChange: (election: TransformedElection) => void;
}) {
  const handleElectionChange = useCallback(
    (value: string) => {
      startTransition(() => {
        const election = elections.find((e) => e.id === value);
        if (election) onElectionChange(election);
      });
    },
    [elections, onElectionChange]
  );

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        Select an Election
      </h2>
      <Select value={currentElection.id} onValueChange={handleElectionChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {elections.map((election) => (
            <SelectItem key={election.id} value={election.id}>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm sm:text-base">{election.name}</span>
                <Badge
                  variant="outline"
                  className={`ml-2 text-xs ${getStatusColor(election.status)}`}
                >
                  {election.status}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-xs sm:text-sm">{currentElection.date}</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          {currentElection.description}
        </p>
      </div>
    </div>
  );
});

const PositionButton = memo(function PositionButton({
  position,
  isActive,
  onClick,
}: {
  position: TransformedElection["positions"][0];
  isActive: boolean;
  onClick: () => void;
}) {
  const handleClick = useCallback(() => {
    startTransition(() => {
      onClick();
    });
  }, [onClick]);

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      className="justify-start h-auto py-2 sm:py-3 px-3 sm:px-4"
      onClick={handleClick}
    >
      <div className="text-left">
        <div className="font-medium text-xs sm:text-sm truncate">
          {position.title}
        </div>
        <div className="text-xs text-muted-foreground" suppressHydrationWarning>
          {position.candidates.length} candidates
        </div>
      </div>
    </Button>
  );
});

const PositionSelector = memo(function PositionSelector({
  positions,
  electionStatus,
  isUpdatingPercentages,
  hideNames = false,
}: {
  positions: TransformedElection["positions"];
  electionStatus: TransformedElection["status"];
  isUpdatingPercentages: boolean;
  hideNames?: boolean;
}) {
  const [currentPosition, setCurrentPosition] = useState(
    () => positions[0] || null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Update current position when positions change
  useEffect(() => {
    if (positions && positions.length > 0 && !currentPosition) {
      setCurrentPosition(positions[0]);
    }
  }, [positions, currentPosition]);

  // Initialize loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Short delay to prevent flash
    return () => clearTimeout(timer);
  }, [currentPosition]);

  const handlePositionChange = useCallback(
    (value: string) => {
      startTransition(() => {
        const selected = positions?.find(
          (p) => p.title.toLowerCase().replace(/\s+/g, "-") === value
        );
        if (selected) {
          setCurrentPosition(selected);
          setIsLoading(true);
        }
      });
    },
    [positions]
  );

  const handlePositionClick = useCallback(
    (position: TransformedElection["positions"][0]) => {
      startTransition(() => {
        setCurrentPosition(position);
        setIsLoading(true);
      });
    },
    []
  );

  // Early return if no positions or currentPosition
  if (!positions || positions.length === 0 || !currentPosition) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            No positions available for this election.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="w-full lg:w-96">
          <Select
            value={currentPosition.title.toLowerCase().replace(/\s+/g, "-")}
            onValueChange={handlePositionChange}
          >
            <SelectTrigger className="text-sm lg:text-base">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {positions?.map((position) => (
                <SelectItem
                  key={position.title}
                  value={position.title.toLowerCase().replace(/\s+/g, "-")}
                  className="text-sm lg:text-base"
                >
                  {position.title}
                </SelectItem>
              )) || []}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6 lg:space-y-8">
        <div>
          <h3 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">
            {currentPosition.title}
          </h3>
          {electionStatus === "upcoming" ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 lg:p-6 mb-6">
              <p className="text-yellow-800 text-base">
                This election has not started yet. Voting will begin soon and
                results will be displayed here.
              </p>
            </div>
          ) : (
            <div className="critical-grid-mobile">
              {isLoading
                ? Array.from(
                    { length: currentPosition?.candidates?.length || 2 },
                    (_, i) => <CandidateCardSkeleton key={i} />
                  )
                : currentPosition.candidates?.map((candidate, index) => (
                    <Suspense
                      key={candidate.id}
                      fallback={<CandidateCardSkeleton />}
                    >
                      <CandidateCard
                        candidate={candidate}
                        index={index}
                        isUpdatingPercentages={isUpdatingPercentages}
                        showNames={!hideNames}
                      />
                    </Suspense>
                  )) || []}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:space-y-6">
          <h3 className="text-lg lg:text-xl font-medium">All Positions</h3>
          <div className="grid gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {positions?.map((position) => (
              <PositionButton
                key={position.title}
                position={position}
                isActive={position.title === currentPosition?.title}
                onClick={() => handlePositionClick(position)}
              />
            )) || []}
          </div>
        </div>
      </div>
    </div>
  );
});

export default function Home() {
  const {
    elections: liveElections,
    activeElection,
    loading,
    error,
    refetch,
    refetchPercentages,
  } = useHomeResults();
  const [showElectionSelector, setShowElectionSelector] = useState(false);
  const [isUpdatingPercentages, setIsUpdatingPercentages] = useState(false);
  const { toast } = useToast();

  // Use the auto status hook to check for election status updates
  const { manualCheck } = useElectionAutoStatus({
    enabled: false, // We'll manually trigger checks
    onStatusUpdate: (updates) => {
      if (updates && updates.length > 0) {
        // Show a toast notification when election statuses are updated
        toast({
          title: "Election Status Updated",
          description: `Updated ${updates.length} election(s) status`,
        });

        // Refetch the data to show updated results
        refetch();
      }
    },
  });

  // Run a manual check when the component mounts
  useEffect(() => {
    manualCheck();
  }, [manualCheck]);

  // Transform live data to match the expected format
  const transformedElections: TransformedElection[] = useMemo(() => {
    // If no live elections, return empty array
    if (!liveElections || liveElections.length === 0) {
      console.log("📊 No live elections found");
      return [];
    }

    return liveElections.map((election) => {
      const positions = election.positions.map((position) => {
        const totalVotes = position.candidates.reduce(
          (sum, candidate) => sum + candidate.votes,
          0
        );

        const candidates = position.candidates.map((candidate) => {
          // Calculate percentage based on total voters in the election, not just votes for this position
          const percentage =
            election.totalVoters && election.totalVoters > 0
              ? Math.round((candidate.votes / election.totalVoters) * 100)
              : 0;
          const avatarUrl =
            candidate.avatar || getOptimizedAvatar(candidate.name);

          return {
            id: candidate.id,
            name: candidate.name,
            votes: candidate.votes,
            avatarUrl,
            percentage,
          };
        });

        return {
          title: position.name,
          candidates,
          totalVotes: election.totalVoters || 0, // Use total voters for the election
        };
      });

      return {
        id: election.id.toString(),
        name: election.name,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        status: election.status.toLowerCase() as
          | "active"
          | "completed"
          | "upcoming",
        description: `${election.name} - Live Results`,
        positions,
      };
    });
  }, [liveElections]);

  // Use active election if available, otherwise use first election
  const currentElection = useMemo(() => {
    if (activeElection && transformedElections.length > 0) {
      const activeTransformed = transformedElections.find(
        (e) => e.id === activeElection.id.toString()
      );
      if (activeTransformed) return activeTransformed;
    }
    return transformedElections[0] || null;
  }, [activeElection, transformedElections]);

  // Check if names should be hidden for the current election
  const hideNames = useMemo(() => {
    if (!currentElection || !liveElections) return false;

    const liveElection = liveElections.find(
      (e) => e.id.toString() === currentElection.id
    );

    return liveElection?.hideName ?? false;
  }, [currentElection, liveElections]);

  const handleSwitchElection = useCallback(() => {
    startTransition(() => {
      setShowElectionSelector(!showElectionSelector);
    });
  }, [showElectionSelector]);

  const handleElectionChange = useCallback((election: TransformedElection) => {
    startTransition(() => {
      setShowElectionSelector(false);
    });
  }, []);

  const handleRefreshPercentages = useCallback(async () => {
    setIsUpdatingPercentages(true);
    await refetchPercentages();
    // Add a small delay to show the updating state
    setTimeout(() => setIsUpdatingPercentages(false), 500);
  }, [refetchPercentages]);

  const totalCandidates = useMemo(
    () =>
      currentElection?.positions?.reduce(
        (sum: number, pos: any) => sum + (pos?.candidates?.length || 0),
        0
      ) || 0,
    [currentElection]
  );

  return (
    <div className="critical-layout">
      <Suspense fallback={null}>
        <Header onSwitchElection={handleSwitchElection} />
      </Suspense>

      <main className="critical-main">
        <div className="space-y-6 lg:space-y-8">
          {/* Live Results Header */}
          {!loading && (
            <div className="flex items-center justify-between py-6">
              <div className="text-center space-y-3 flex-1">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-3 py-6">
                  <h1 className="text-2xl lg:text-4xl font-bold tracking-tight">
                    {currentElection?.name || (
                      <>
                        Wesleyan University Philippines <br /> Election Results
                      </>
                    )}
                  </h1>
                  {currentElection && (
                    <Badge
                      className={`${getStatusColor(currentElection.status)} text-sm lg:text-base`}
                    >
                      {currentElection.status.charAt(0).toUpperCase() +
                        currentElection.status.slice(1)}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-base lg:text-lg max-w-3xl mx-auto">
                  {currentElection
                    ? `${currentElection.description} • ${currentElection.date}`
                    : "Live election results and voting information"}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Unable to Load Election Results
                  </h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <p className="text-red-600 text-xs mt-2">
                    Please try refreshing the page or contact the administrator
                    if the problem persists.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Elections State */}
          {!loading &&
            !error &&
            liveElections &&
            liveElections.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">
                      No Active Elections
                    </h3>
                    <p className="text-amber-700 text-sm mt-1">
                      There are currently no active elections available for
                      viewing.
                    </p>
                    <p className="text-amber-600 text-xs mt-2">
                      Elections will appear here once they are created by the
                      administrator.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading live results...</p>
            </div>
          )}

          {/* Content - only show when not loading and has elections */}
          {!loading && currentElection && (
            <>
              {/* Show election info even if no positions */}
              <div className="flex items-center justify-center gap-4 py-4 lg:py-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                  <span className="font-medium text-base lg:text-lg">
                    Total Candidates: {totalCandidates}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-sm"
                  onClick={handleRefreshPercentages}
                  disabled={isUpdatingPercentages}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isUpdatingPercentages ? "animate-spin" : ""}`}
                  />
                  Update Percentages
                </Button>
              </div>

              {showElectionSelector && transformedElections.length > 0 && (
                <ElectionSelector
                  elections={transformedElections}
                  currentElection={currentElection}
                  onElectionChange={handleElectionChange}
                />
              )}

              {!showElectionSelector && (
                <>
                  {/* Show positions if available, otherwise show no positions message */}
                  {currentElection.positions &&
                  currentElection.positions.length > 0 ? (
                    <PositionSelector
                      positions={currentElection.positions}
                      electionStatus={currentElection.status}
                      isUpdatingPercentages={isUpdatingPercentages}
                      hideNames={hideNames} // Pass hideNames to PositionSelector
                    />
                  ) : (
                    <div className="space-y-6 lg:space-y-8">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-8 w-8 text-blue-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-blue-800">
                              Active Election: {currentElection.name}
                            </h3>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-blue-700 text-base">
                            This election is currently active but no positions
                            have been configured yet.
                          </p>
                          <p className="text-blue-600 text-sm">
                            The administrator needs to add positions and
                            candidates before voting can begin.
                          </p>
                          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <p className="text-blue-800 text-sm font-medium">
                              Election Status:{" "}
                              <span className="text-green-600">ACTIVE</span>
                            </p>
                            <p className="text-blue-700 text-xs mt-1">
                              Results will appear here once positions and
                              candidates are added.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Suspense fallback={<div className="h-16 bg-background border-t" />}>
        <LazyFooter />
      </Suspense>
    </div>
  );
}
