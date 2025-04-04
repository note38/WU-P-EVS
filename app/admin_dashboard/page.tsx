"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vote, Users, FileText, LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend: "increase" | "decrease" | "neutral" | "upcoming";
  trendValue: string;
}

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
}: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="mt-4">
          <p
            className={`text-xs flex items-center ${
              trend === "increase"
                ? "text-green-500"
                : trend === "decrease"
                ? "text-red-500"
                : "text-gray-500"
            }`}
          >
            {trendValue}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState("overview");

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      <Tabs
        defaultValue="overview"
        className="mt-6"
        onValueChange={setCurrentView}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="voters">Voters</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Elections"
              value="1"
              description="Active election"
              icon={Vote}
              trend="upcoming"
              trendValue="May 15, 2025"
            />
            <StatCard
              title="Candidates"
              value="51"
              description="Across 12 positions"
              icon={Users}
              trend="increase"
              trendValue="3 new this week"
            />
            <StatCard
              title="Partylist"
              value="4"
              description="Political parties"
              icon={FileText}
              trend="neutral"
              trendValue="No change"
            />
            <StatCard
              title="Voters"
              value="828"
              description="Registered voters"
              icon={Users}
              trend="increase"
              trendValue="12% from last election"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>content</CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>content</CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <CardTitle>Candidates Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Candidate management content will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voters">
          <Card>
            <CardHeader>
              <CardTitle>Voters Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Voter management content will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Election Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Timeline content will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
