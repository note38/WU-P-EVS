"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users } from "lucide-react";
import {
  useState,
  useMemo,
  lazy,
  Suspense,
  useCallback,
  memo,
  startTransition,
  useEffect,
} from "react";
import dynamic from "next/dynamic";

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

interface Election {
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
}: {
  candidate: Election["positions"][0]["candidates"][0];
  index: number;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-3 lg:p-6">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="relative h-8 w-8 lg:h-16 lg:w-16 overflow-hidden rounded-full border flex-shrink-0">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gray-200 critical-skeleton"></div>
            )}
            <img
              src={candidate.avatarUrl}
              alt={candidate.name}
              className={`h-full w-full object-cover transition-opacity duration-200 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              width="64"
              height="64"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {imageError && (
              <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-600 text-xs lg:text-lg font-medium">
                {candidate.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm lg:text-lg font-semibold text-foreground mb-0.5 truncate">
              {candidate.name}
            </h3>
            <p className="text-base lg:text-xl font-bold text-primary">
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
  elections: Election[];
  currentElection: Election;
  onElectionChange: (election: Election) => void;
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
  position: Election["positions"][0];
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
}: {
  positions: Election["positions"];
  electionStatus: Election["status"];
}) {
  const [currentPosition, setCurrentPosition] = useState(positions[0]);
  const [isLoading, setIsLoading] = useState(true);

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
        const selected = positions.find(
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
    (position: Election["positions"][0]) => {
      startTransition(() => {
        setCurrentPosition(position);
        setIsLoading(true);
      });
    },
    []
  );

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
              {positions.map((position) => (
                <SelectItem
                  key={position.title}
                  value={position.title.toLowerCase().replace(/\s+/g, "-")}
                  className="text-sm lg:text-base"
                >
                  {position.title}
                </SelectItem>
              ))}
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
                    { length: currentPosition.candidates.length || 2 },
                    (_, i) => <CandidateCardSkeleton key={i} />
                  )
                : currentPosition.candidates.map((candidate, index) => (
                    <Suspense
                      key={candidate.id}
                      fallback={<CandidateCardSkeleton />}
                    >
                      <CandidateCard candidate={candidate} index={index} />
                    </Suspense>
                  ))}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:space-y-6">
          <h3 className="text-lg lg:text-xl font-medium">All Positions</h3>
          <div className="grid gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {positions.map((position) => (
              <PositionButton
                key={position.title}
                position={position}
                isActive={position.title === currentPosition.title}
                onClick={() => handlePositionClick(position)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default function Home() {
  const elections = STATIC_ELECTIONS;
  const [currentElection, setCurrentElection] = useState<Election>(
    elections[0]
  );
  const [showElectionSelector, setShowElectionSelector] = useState(false);

  const handleSwitchElection = useCallback(() => {
    startTransition(() => {
      setShowElectionSelector(!showElectionSelector);
    });
  }, [showElectionSelector]);

  const handleElectionChange = useCallback((election: Election) => {
    startTransition(() => {
      setCurrentElection(election);
      setShowElectionSelector(false);
    });
  }, []);

  const totalCandidates = useMemo(
    () =>
      currentElection.positions.reduce(
        (sum, pos) => sum + pos.candidates.length,
        0
      ),
    [currentElection.positions]
  );

  return (
    <div className="critical-layout">
      <Suspense fallback={null}>
        <Header onSwitchElection={handleSwitchElection} />
      </Suspense>

      <main className="critical-main">
        <div className="space-y-6 lg:space-y-8">
          <div className="text-center space-y-3">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-3">
              <h1 className="text-2xl lg:text-4xl font-bold tracking-tight">
                {currentElection.name}
              </h1>
              <Badge
                className={`${getStatusColor(currentElection.status)} text-sm lg:text-base`}
              >
                {currentElection.status.charAt(0).toUpperCase() +
                  currentElection.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-base lg:text-lg max-w-3xl mx-auto">
              {currentElection.description} • {currentElection.date}
            </p>
          </div>

          {showElectionSelector && (
            <ElectionSelector
              elections={elections}
              currentElection={currentElection}
              onElectionChange={handleElectionChange}
            />
          )}

          {!showElectionSelector && (
            <>
              <div className="flex items-center justify-center gap-4 py-4 lg:py-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                  <span className="font-medium text-base lg:text-lg">
                    Total Candidates: {totalCandidates}
                  </span>
                </div>
              </div>

              <PositionSelector
                positions={currentElection.positions}
                electionStatus={currentElection.status}
              />
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
