"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BackupData {
  users: any[];
  elections: any[];
  departments: any[];
  years: any[];
  positions: any[];
  candidates: any[];
  voters: any[];
  votes: any[];
  partylists: any[];
  metadata: {
    version: string;
    timestamp: string;
    systemInfo: string;
  };
}

export function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    try {
      // Update progress
      setBackupProgress(30);

      // Fetch backup data from API
      const response = await fetch("/api/backup");

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create backup: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      setBackupProgress(70);

      const backupData = await response.json();

      // Create a blob and download it
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voting-system-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupProgress(100);

      toast({
        title: "Backup Completed",
        description: "Your system data has been successfully backed up.",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description:
          "There was an error creating the backup. Please try again.",
        variant: "destructive",
      });
      console.error("Backup error:", error);
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupProgress(0), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackupFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!backupFile) {
      toast({
        title: "No File Selected",
        description: "Please select a backup file to restore.",
        variant: "destructive",
      });
      return;
    }

    setIsRestoring(true);
    setRestoreProgress(0);

    try {
      // Read the file content
      setRestoreProgress(10);

      const fileContent = await backupFile.text();

      setRestoreProgress(20);

      // Validate JSON format
      let backupData;
      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error(
          "Invalid backup file format. Please select a valid JSON backup file."
        );
      }

      setRestoreProgress(30);

      // Validate backup data structure
      if (!backupData.metadata) {
        throw new Error(
          "Invalid backup file: Missing metadata. Please select a valid backup file."
        );
      }

      if (!backupData.users || !backupData.elections) {
        throw new Error(
          "Invalid backup file: Missing required data. Please select a valid backup file."
        );
      }

      setRestoreProgress(40);

      // Send restore request to API
      console.log("Sending restore request to API");
      const response = await fetch("/api/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backupData),
      });

      setRestoreProgress(80);

      console.log(
        "Restore API response:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        // Try to parse error response, but handle case where it might not be JSON
        let errorMessage = `Failed to restore backup: ${response.status} ${response.statusText}`;

        try {
          const contentType = response.headers.get("content-type");
          console.log("Restore API response content-type:", contentType);
          console.log("Restore API response status:", response.status);

          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.log("Restore API error data:", errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;

            // Include additional error details if available
            if (errorData.stack && process.env.NODE_ENV === "development") {
              errorMessage += `\n\nDetails:\n${errorData.stack}`;
            }
          } else {
            const errorText = await response.text();
            console.log("Restore API error text:", errorText);
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error("Restore API error parsing failed:", parseError);
          // If we can't parse JSON, use the response text
          try {
            const errorText = await response.text();
            console.log("Restore API raw error text:", errorText);
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error("Restore API text reading failed:", textError);
            // If we can't get text, use status text
            errorMessage = response.statusText || errorMessage;
          }
        }

        console.error("Restore API error:", errorMessage);
        throw new Error(`Restore API Error: ${errorMessage}`);
      }

      const result = await response.json();

      setRestoreProgress(100);

      toast({
        title: "Restore Completed",
        description: "Your system data has been successfully restored.",
      });
    } catch (error: any) {
      console.error("Restore error:", error);
      toast({
        title: "Restore Failed",
        description:
          error.message ||
          "There was an error restoring the backup. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      setTimeout(() => setRestoreProgress(0), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup & Restore
        </CardTitle>
        <CardDescription>
          Create backups of your system data or restore from a previous backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Backup Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Create Backup</h3>
            <p className="text-sm text-muted-foreground">
              Download a complete backup of your system data including
              elections, voters, and settings.
            </p>
          </div>

          {isBackingUp && (
            <div className="space-y-2">
              <Progress value={backupProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Creating backup... {backupProgress}%
              </p>
            </div>
          )}

          <Button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isBackingUp ? "Backing Up..." : "Download Backup"}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Restore Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Restore Backup</h3>
            <p className="text-sm text-muted-foreground">
              Upload a backup file to restore your system data. This will
              overwrite current data.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup-file">Backup File</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={isRestoring}
            />
          </div>

          {isRestoring && (
            <div className="space-y-2">
              <Progress value={restoreProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Restoring backup... {restoreProgress}%
              </p>
            </div>
          )}

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Restoring a backup will overwrite all current data in the system.
              Make sure you have a recent backup before proceeding.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleRestore}
            disabled={isRestoring || !backupFile}
            variant="destructive"
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isRestoring ? "Restoring..." : "Restore Backup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
