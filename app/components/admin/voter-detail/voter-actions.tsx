"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PrinterIcon,
  SendIcon,
  UsersIcon,
  UploadIcon,
  FileIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function VoterActions() {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [migrateDialogOpen, setMigrateDialogOpen] = useState(false);

  return (
    <div className="flex gap-2 md:hidden lg:flex">
      {/* Print Voters Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Print Voter List</DialogTitle>
            <DialogDescription>
              Select the print options for the voter list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="print-format" className="col-span-4">
                Format
              </Label>
              <Select defaultValue="detailed">
                <SelectTrigger id="print-format" className="col-span-4">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">Detailed List</SelectItem>
                  <SelectItem value="compact">Compact List</SelectItem>
                  <SelectItem value="cards">Voter ID Cards</SelectItem>
                  <SelectItem value="labels">Mailing Labels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="print-filter" className="col-span-4">
                Filter
              </Label>
              <Select defaultValue="all">
                <SelectTrigger id="print-filter" className="col-span-4">
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Voters</SelectItem>
                  <SelectItem value="voted">Voted</SelectItem>
                  <SelectItem value="not_voted">Not Voted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setPrintDialogOpen(false)}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Credentials Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <SendIcon className="mr-2 h-4 w-4" />
            Email
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Send Voter Credentials</DialogTitle>
            <DialogDescription>
              Send login credentials to voters via email.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="template">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">Email Template</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
            </TabsList>
            <TabsContent value="template" className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-subject" className="col-span-4">
                    Subject
                  </Label>
                  <Input
                    id="email-subject"
                    defaultValue="Your Voting Credentials"
                    className="col-span-4"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-template" className="col-span-4">
                    Template
                  </Label>
                  <Select defaultValue="default">
                    <SelectTrigger id="email-template" className="col-span-4">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Template</SelectItem>
                      <SelectItem value="reminder">
                        Reminder Template
                      </SelectItem>
                      <SelectItem value="custom">Custom Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-content" className="col-span-4">
                    Content
                  </Label>
                  <textarea
                    id="email-content"
                    className="col-span-4 min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={`Dear [Voter Name],

Your voting credentials for the upcoming election are:

Username: [Voter ID]
Password: [Password]

Please visit [Voting URL] to cast your vote.

Thank you,
Election Administration Team`}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="recipients" className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-recipients" className="col-span-4">
                    Recipients
                  </Label>
                  <Select defaultValue="all">
                    <SelectTrigger id="email-recipients" className="col-span-4">
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Voters</SelectItem>
                      <SelectItem value="not_voted">Not Voted</SelectItem>
                      <SelectItem value="selected">Selected Voters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-schedule" className="col-span-4">
                    Schedule
                  </Label>
                  <Select defaultValue="now">
                    <SelectTrigger id="email-schedule" className="col-span-4">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Send Now</SelectItem>
                      <SelectItem value="later">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setEmailDialogOpen(false)}>
              <SendIcon className="mr-2 h-4 w-4" />
              Send Emails
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Migrate Voters Dialog */}
      <Dialog open={migrateDialogOpen} onOpenChange={setMigrateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <UsersIcon className="mr-2 h-4 w-4" />
            Migrate
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Migrate Voters</DialogTitle>
            <DialogDescription>
              Import voters from a CSV file or another system.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="import">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            <TabsContent value="import" className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="import-source" className="col-span-4">
                    Source
                  </Label>
                  <Select defaultValue="csv">
                    <SelectTrigger id="import-source" className="col-span-4">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV File</SelectItem>
                      <SelectItem value="excel">Excel File</SelectItem>
                      <SelectItem value="api">External API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="import-file" className="col-span-4">
                    File
                  </Label>
                  <div className="col-span-4 flex items-center gap-2">
                    <Input
                      id="import-file"
                      type="file"
                      className="col-span-3"
                    />
                    <Button variant="outline" size="icon">
                      <UploadIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="import-options" className="col-span-4">
                    Options
                  </Label>
                  <div className="col-span-4 flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="update-existing"
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="update-existing">
                        Update existing voters
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="send-credentials"
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="send-credentials">
                        Send credentials to new voters
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="export" className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="export-format" className="col-span-4">
                    Format
                  </Label>
                  <Select defaultValue="csv">
                    <SelectTrigger id="export-format" className="col-span-4">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV File</SelectItem>
                      <SelectItem value="excel">Excel File</SelectItem>
                      <SelectItem value="json">JSON File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="export-data" className="col-span-4">
                    Data to Export
                  </Label>
                  <Select defaultValue="all">
                    <SelectTrigger id="export-data" className="col-span-4">
                      <SelectValue placeholder="Select data" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Voters</SelectItem>
                      <SelectItem value="voted">Voted</SelectItem>
                      <SelectItem value="not_voted">Not Voted</SelectItem>
                      <SelectItem value="selected">Selected Voters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMigrateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setMigrateDialogOpen(false)}>
              <FileIcon className="mr-2 h-4 w-4" />
              Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
