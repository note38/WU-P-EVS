// File: src/components/Dashboard/index.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart2 } from "lucide-react";
import { useState } from "react";
import ActivityList from "./activity-list";
import ElectionResults from "./election-result";
import { mockData } from "./moc-data";
import StatsCards from "./stats-card";
import VoterList from "./voter-list";

export default function Dashboard() {
  const [isFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { recentActivities, recentVoters, statsCards } = mockData;

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

        {activeTab === "overview" && <StatsCards cards={statsCards} />}

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <ActivityList activities={recentActivities} />
            <VoterList voters={recentVoters} />
          </div>
        </TabsContent>

        <TabsContent value="live">
          <ElectionResults />
        </TabsContent>
      </Tabs>
    </div>
  );
}
