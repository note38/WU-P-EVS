"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/app/components/settings/profile-setting";
import { DepartmentSettings } from "@/app/components/settings/department-form";
import { YearSettings } from "@/app/components/settings/year-form";
import { DataLogs } from "@/app/components/settings/data-log";
import { AccountSettings } from "@/app/components/settings/account-form";
import {
  SettingsProfileSkeleton,
  SettingsTableSkeleton,
  SettingsAccountSkeleton,
  SettingsDataLogsSkeleton,
} from "@/app/components/ui/skeleton";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="years">Years</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="logs">Data Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {loading ? <SettingsProfileSkeleton /> : <ProfileSettings />}
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          {loading ? <SettingsTableSkeleton /> : <DepartmentSettings />}
        </TabsContent>

        <TabsContent value="years" className="space-y-4">
          {loading ? <SettingsTableSkeleton /> : <YearSettings />}
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          {loading ? <SettingsAccountSkeleton /> : <AccountSettings />}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {loading ? <SettingsDataLogsSkeleton /> : <DataLogs />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
