// File: src/components/Dashboard/index.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BarChart2,
  Vote,
  Users,
  Flag,
  Award,
  Expand,
} from "lucide-react";
import StatsCards from "./stats-card";
import ActivityList from "./activity-list";
import VoterList from "./voter-list";
import ElectionResults from "./election-result";
import FullscreenResults from "./fullscreen";
import { mockData } from "./moc-data";

export default function Dashboard() {
  const [showNames, setShowNames] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl
            .requestFullscreen()
            .then(() => setIsFullscreen(true))
            .catch(() => setIsFullscreen(false));
        } else {
          // Fallback for browsers that don't support fullscreen API
          setIsFullscreen(!isFullscreen);
        }
      } else {
        if (document.exitFullscreen) {
          document
            .exitFullscreen()
            .then(() => {
              setIsFullscreen(false);
              setActiveTab("live"); // Ensure we stay on the live results tab when exiting fullscreen
            })
            .catch(() => setIsFullscreen(false));
        }
      }
    } catch (error) {
      console.error("Fullscreen API error:", error);
      // Fallback: just toggle the state
      setIsFullscreen(!isFullscreen);
      if (isFullscreen) {
        setActiveTab("live"); // Ensure we stay on the live results tab when exiting fullscreen
      }
    }
  };

  const { positions, recentActivities, recentVoters, statsCards } = mockData;

  return (
    <div
      className={`container mx-auto ${isFullscreen ? "fullscreen-mode" : ""}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {!isFullscreen && (
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Election Results</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-names"
                    checked={showNames}
                    onCheckedChange={setShowNames}
                  />
                  <Label htmlFor="show-names">Show Names</Label>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                >
                  <Expand className="h-4 w-4" />
                  <span className="sr-only">Toggle fullscreen</span>
                </Button>
              </div>
            </div>

            <ElectionResults
              positions={positions}
              showNames={showNames}
              isFullscreen={isFullscreen}
            />
          </TabsContent>
        </Tabs>
      )}

      {isFullscreen && (
        <FullscreenResults
          positions={positions}
          showNames={showNames}
          toggleFullscreen={toggleFullscreen}
          setShowNames={setShowNames}
        />
      )}
    </div>
  );
}
