"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function TestRestorePage() {
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();

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
    
    try {
      // Read the file content
      const fileContent = await backupFile.text();
      
      // Validate JSON format
      let backupData;
      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error("Invalid backup file format. Please select a valid JSON backup file.");
      }
      
      // Validate backup data structure
      if (!backupData.metadata) {
        throw new Error("Invalid backup file: Missing metadata. Please select a valid backup file.");
      }
      
      if (!backupData.users || !backupData.elections) {
        throw new Error("Invalid backup file: Missing required data. Please select a valid backup file.");
      }
      
      // Send restore request to API
      console.log("Sending test restore request to API with data:", {
        metadata: backupData.metadata,
        usersCount: backupData.users?.length,
        electionsCount: backupData.elections?.length
      });
      
      const response = await fetch('/api/test-restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });
      
      console.log("Test Restore API response:", response.status, response.statusText);
      
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `Failed to test restore backup: ${response.status} ${response.statusText}`;
        
        try {
          const contentType = response.headers.get('content-type');
          console.log('Response content-type:', contentType);
          
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.log('Error data from API:', errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            console.log('Error text from API:', errorText);
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing API response:', parseError);
          // If we can't parse JSON, use the response text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            // If we can't get text, use status text
            errorMessage = response.statusText || errorMessage;
          }
        }
        
        console.error("Test Restore API error:", errorMessage);
        throw new Error(`Test Restore API Error: ${errorMessage}`);
      }
      
      const result = await response.json();
      console.log("Test Restore successful:", result);
      
      toast({
        title: "Test Restore Completed",
        description: "Your system data test restore was successful.",
      });
    } catch (error: any) {
      console.error("Test Restore error:", error);
      toast({
        title: "Test Restore Failed",
        description: error.message || "There was an error testing the restore. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Restore Functionality</h1>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="backup-file" className="block text-sm font-medium mb-2">
            Backup File
          </label>
          <Input
            id="backup-file"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={isRestoring}
          />
        </div>
        
        <Button 
          onClick={handleRestore} 
          disabled={isRestoring || !backupFile}
          variant="destructive"
        >
          {isRestoring ? "Testing Restore..." : "Test Restore"}
        </Button>
      </div>
    </div>
  );
}