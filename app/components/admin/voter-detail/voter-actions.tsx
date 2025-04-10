"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
                  <SelectItem value="cards">Voter ID Cards</SelectItem>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Voter Credentials</DialogTitle>
            <DialogDescription>
              Send login credentials to voters via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                    <SelectItem value="selected">Selected Voters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
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
        {/* <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Migrate Voters</DialogTitle>
            <DialogDescription>
              Import voters from a CSV file or another system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="export-data" className="col-span-4">
                Data Selection
              </Label>
              <Select defaultValue="all">
                <SelectTrigger id="export-data" className="col-span-4">
                  <SelectValue placeholder="Select data" />
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
        </DialogContent> */}
      </Dialog>
    </div>
  );
}
