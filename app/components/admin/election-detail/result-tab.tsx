"use client";

import type React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, PrinterIcon, ShareIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResultsTabProps {
  electionId: number;
}

export function ResultsTab({ electionId }: ResultsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Election Results</h2>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print Results
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button variant="outline" size="sm">
            <ShareIcon className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    <SelectItem value="president">President</SelectItem>
                    <SelectItem value="vice-president">
                      Vice President
                    </SelectItem>
                    <SelectItem value="secretary">Secretary</SelectItem>
                    <SelectItem value="treasurer">Treasurer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Voting Method</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="mail-in">Mail-In</SelectItem>
                    <SelectItem value="mobile">Mobile App</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Period</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Entire Election</SelectItem>
                    <SelectItem value="day1">Day 1</SelectItem>
                    <SelectItem value="day2">Day 2</SelectItem>
                    <SelectItem value="morning">Morning Hours</SelectItem>
                    <SelectItem value="afternoon">Afternoon Hours</SelectItem>
                    <SelectItem value="evening">Evening Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-3/4"></div>
      </div>
    </div>
  );
}

// Helper component for the label
function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium mb-1.5">{children}</div>;
}
