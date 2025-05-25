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
import { Calendar, ChevronLeft, ChevronRight, Users } from "lucide-react";
import {
  useState,
  useMemo,
  lazy,
  Suspense,
  useCallback,
  memo,
  startTransition,
} from "react";
import { Footer } from "../components/landing_page/navigation/Footer";
import { Header } from "../components/landing_page/navigation/Header";

// Only lazy load the Footer (below the fold)
const LazyFooter = lazy(() =>
  import("../components/landing_page/navigation/Footer").then((module) => ({
    default: module.Footer,
  }))
);

// Simplified avatar function - use ui-avatars.com for faster loading
const getSimpleAvatar = (name: string) => {
  const cleanName = name.replace(/\s+/g, "+");
  return `https://ui-avatars.com/api/?name=${cleanName}&size=64&background=random&format=svg`;
};

// Very simplified election data for better performance
const generateSimpleElections = () => {
  return [
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
              avatarUrl: getSimpleAvatar("Alex Johnson"),
            },
            {
              id: 2,
              name: "Sam Williams",
              votes: 82,
              percentage: 48,
              avatarUrl: getSimpleAvatar("Sam Williams"),
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
              avatarUrl: getSimpleAvatar("Taylor Smith"),
            },
            {
              id: 4,
              name: "Jordan Lee",
              votes: 69,
              percentage: 42,
              avatarUrl: getSimpleAvatar("Jordan Lee"),
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
              avatarUrl: getSimpleAvatar("Casey Brown"),
            },
            {
              id: 6,
              name: "Riley Davis",
              votes: 49,
              percentage: 39,
              avatarUrl: getSimpleAvatar("Riley Davis"),
            },
          ],
          totalVotes: 125,
        },
      ],
    },
  ];
};

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

// Memoized ElectionSelector component
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
                <span>{election.name}</span>
                <Badge
                  variant="outline"
                  className={`ml-2 ${getStatusColor(election.status)}`}
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
          <Calendar className="w-4 h-4 mr-2" />
          {currentElection.date}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {currentElection.description}
        </p>
      </div>
    </div>
  );
});

// Memoized CandidateCard component
const CandidateCard = memo(function CandidateCard({
  candidate,
  index,
}: {
  candidate: Election["positions"][0]["candidates"][0];
  index: number;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span suppressHydrationWarning>{candidate.name}</span>
          <span
            className="text-lg font-bold text-primary"
            suppressHydrationWarning
          >
            {candidate.percentage}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border">
            <img
              src={candidate.avatarUrl}
              alt={candidate.name}
              className="h-full w-full object-cover"
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              width="64"
              height="64"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium" suppressHydrationWarning>
                Votes: {candidate.votes}
              </span>
            </div>
            <Progress value={candidate.percentage} className="h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Memoized PositionButton component
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
      className="justify-start h-auto py-3"
      onClick={handleClick}
    >
      <div className="text-left">
        <div className="font-medium">{position.title}</div>
        <div className="text-xs text-muted-foreground" suppressHydrationWarning>
          {position.candidates.length} candidates
        </div>
      </div>
    </Button>
  );
});

// Memoized PositionSelector component
const PositionSelector = memo(function PositionSelector({
  positions,
  electionStatus,
}: {
  positions: Election["positions"];
  electionStatus: Election["status"];
}) {
  const [currentPosition, setCurrentPosition] = useState(positions[0]);

  const handlePositionChange = useCallback(
    (value: string) => {
      startTransition(() => {
        const selected = positions.find(
          (p) => p.title.toLowerCase().replace(/\s+/g, "-") === value
        );
        if (selected) setCurrentPosition(selected);
      });
    },
    [positions]
  );

  const handlePositionClick = useCallback(
    (position: Election["positions"][0]) => {
      startTransition(() => {
        setCurrentPosition(position);
      });
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="w-full md:w-72">
          <Select
            value={currentPosition.title.toLowerCase().replace(/\s+/g, "-")}
            onValueChange={handlePositionChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {positions.map((position) => (
                <SelectItem
                  key={position.title}
                  value={position.title.toLowerCase().replace(/\s+/g, "-")}
                >
                  {position.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-4">{currentPosition.title}</h3>
          {electionStatus === "upcoming" ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-yellow-800">
                This election has not started yet. Voting will begin soon and
                results will be displayed here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentPosition.candidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">All Positions</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  // Use static elections data to prevent hydration mismatches
  const elections = useMemo(() => generateSimpleElections(), []);
  const [currentElection, setCurrentElection] = useState<Election>(
    () => elections[0]
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
    <div className="flex min-h-screen flex-col">
      <Header onSwitchElection={handleSwitchElection} />

      <main className="flex-1 container py-6 md:py-10 m-auto">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {currentElection.name}
              </h1>
              <Badge className={getStatusColor(currentElection.status)}>
                {currentElection.status.charAt(0).toUpperCase() +
                  currentElection.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
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
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium" suppressHydrationWarning>
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
