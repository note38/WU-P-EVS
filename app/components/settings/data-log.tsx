"use client";

import { format } from "date-fns";
import {
  Activity,
  Calendar,
  Download,
  Search,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for demonstration
const voterLogs = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    registeredAt: new Date(2023, 3, 15),
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    registeredAt: new Date(2023, 3, 16),
    status: "active",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    registeredAt: new Date(2023, 3, 17),
    status: "inactive",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
    registeredAt: new Date(2023, 3, 18),
    status: "active",
  },
  {
    id: "5",
    name: "Charlie Davis",
    email: "charlie@example.com",
    registeredAt: new Date(2023, 3, 19),
    status: "pending",
  },
];

const voteLogs = [
  {
    id: "1",
    voter: "John Doe",
    election: "Student Council 2023",
    votedAt: new Date(2023, 4, 10),
    status: "counted",
  },
  {
    id: "2",
    voter: "Jane Smith",
    election: "Student Council 2023",
    votedAt: new Date(2023, 4, 10),
    status: "counted",
  },
  {
    id: "3",
    voter: "Bob Johnson",
    election: "Department Head 2023",
    votedAt: new Date(2023, 4, 12),
    status: "counted",
  },
  {
    id: "4",
    voter: "Alice Brown",
    election: "Student Council 2023",
    votedAt: new Date(2023, 4, 10),
    status: "rejected",
  },
  {
    id: "5",
    voter: "Charlie Davis",
    election: "Department Head 2023",
    votedAt: new Date(2023, 4, 12),
    status: "pending",
  },
];

const adminLogs = [
  {
    id: "1",
    admin: "Admin User",
    action: "Created election",
    target: "Student Council 2023",
    performedAt: new Date(2023, 3, 1),
  },
  {
    id: "2",
    admin: "Admin User",
    action: "Added candidate",
    target: "John Doe",
    performedAt: new Date(2023, 3, 2),
  },
  {
    id: "3",
    admin: "Super Admin",
    action: "Modified election",
    target: "Department Head 2023",
    performedAt: new Date(2023, 3, 5),
  },
  {
    id: "4",
    admin: "Admin User",
    action: "Deleted candidate",
    target: "Jane Smith",
    performedAt: new Date(2023, 3, 7),
  },
  {
    id: "5",
    admin: "Super Admin",
    action: "Finalized election",
    target: "Student Council 2023",
    performedAt: new Date(2023, 3, 9),
  },
];

const activityLogs = [
  {
    id: "1",
    user: "John Doe",
    action: "Logged in",
    ip: "192.168.1.1",
    performedAt: new Date(2023, 4, 10, 9, 30),
  },
  {
    id: "2",
    user: "Admin User",
    action: "Created report",
    ip: "192.168.1.2",
    performedAt: new Date(2023, 4, 10, 10, 15),
  },
  {
    id: "3",
    user: "Jane Smith",
    action: "Updated profile",
    ip: "192.168.1.3",
    performedAt: new Date(2023, 4, 10, 11, 0),
  },
  {
    id: "4",
    user: "Bob Johnson",
    action: "Logged out",
    ip: "192.168.1.4",
    performedAt: new Date(2023, 4, 10, 12, 30),
  },
  {
    id: "5",
    user: "Super Admin",
    action: "Reset password",
    ip: "192.168.1.5",
    performedAt: new Date(2023, 4, 10, 14, 45),
  },
];

export function DataLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "counted":
        return "bg-green-100 text-green-800";
      case "inactive":
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Logs</CardTitle>
        <CardDescription>
          View and manage system logs for voters, votes, admin actions, and
          general activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="voters">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="voters" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Voters</span>
              </TabsTrigger>
              <TabsTrigger value="votes" className="flex items-center gap-2">
                <Vote className="h-4 w-4" />
                <span className="hidden sm:inline">Votes</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voters">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registered Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voterLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.name}</TableCell>
                      <TableCell>{log.email}</TableCell>
                      <TableCell>{format(log.registeredAt, "PPP")}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(log.status)}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="votes">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voter</TableHead>
                    <TableHead>Election</TableHead>
                    <TableHead>Voted Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voteLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.voter}</TableCell>
                      <TableCell>{log.election}</TableCell>
                      <TableCell>{format(log.votedAt, "PPP")}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(log.status)}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="admin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.admin}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.target}</TableCell>
                      <TableCell>{format(log.performedAt, "PPP p")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="activity">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.ip}</TableCell>
                      <TableCell>{format(log.performedAt, "PPP p")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {voterLogs.length} of {voterLogs.length} entries
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                1
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
