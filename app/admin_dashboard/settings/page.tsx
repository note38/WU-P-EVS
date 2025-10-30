"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/app/components/settings/profile-setting";
import { AccountSettings } from "@/app/components/settings/account-form";
import { BackupRestore } from "@/app/components/settings/backup-restore";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

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
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <BackupRestore />
        </TabsContent>
      </Tabs>
    </div>
  );
}
