import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/app/components/settings/profile-setting";
import { DepartmentSettings } from "@/app/components/settings/department-form";
import { YearSettings } from "@/app/components/settings/year-form";
import { DataLogs } from "@/app/components/settings/data-log";
import { AccountSettings } from "@/app/components/settings/account-form";

export default function SettingsPage() {
  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="years">Years</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="logs">Data Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <DepartmentSettings />
        </TabsContent>

        <TabsContent value="years" className="space-y-4">
          <YearSettings />
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <DataLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
