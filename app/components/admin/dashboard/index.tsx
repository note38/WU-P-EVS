// File: src/components/Dashboard/index.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";
import ActivityList from "./activity-list";
import ElectionResults from "./election-result";

import VoterList from "./voter-list";
import {
  DashboardStats,
  RecentActivity,
  RecentVoter,
} from "@/lib/data/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCard {
  title: string;
  value: string;
  description: string;
  icon?: React.ReactNode;
}

export default function Dashboard() {
  const [isFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [recentVoters, setRecentVoters] = useState<RecentVoter[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data in parallel
        const [statsResponse, activitiesResponse, votersResponse] =
          await Promise.all([
            fetch("/api/dashboard/stats"),
            fetch("/api/dashboard/activities?limit=10"),
            fetch("/api/dashboard/voters?limit=10"),
          ]);

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setDashboardStats(stats);
        }

        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json();
          setRecentActivities(activities);
        }

        if (votersResponse.ok) {
          const voters = await votersResponse.json();
          setRecentVoters(voters);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Convert dashboard stats to stats cards format
  const statsCards: StatsCard[] = dashboardStats
    ? [
        {
          title: "Total Elections",
          value: dashboardStats.totalElections.toString(),
          description: `${dashboardStats.activeElections} active, ${dashboardStats.completedElections} completed`,
        },
        {
          title: "Candidates",
          value: dashboardStats.totalCandidates.toString(),
          description: "Across all elections",
        },
        {
          title: "Partylists",
          value: dashboardStats.totalPartylists.toString(),
          description: "Political parties",
        },
        {
          title: "Voters",
          value: dashboardStats.totalVoters.toString(),
          description: `${dashboardStats.votedVoters} have voted`,
        },
      ]
    : [];

  return (
    <div
      className={`container mx-auto ${isFullscreen ? "fullscreen-mode" : ""}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <Tabs
        value={activeTab}
        defaultValue="overview"
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Live Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Activity List Skeleton */}
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="mb-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex justify-between border-b border-border pb-2"
                    >
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Voter List Skeleton */}
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="mb-4">
                  <Skeleton className="h-6 w-28 mb-2" />
                  <Skeleton className="h-4 w-52" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex justify-between border-b border-border pb-2"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <ActivityList activities={recentActivities} />
              <VoterList voters={recentVoters} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="live">
          <ElectionResults />
        </TabsContent>
      </Tabs>
    </div>
  );
}
