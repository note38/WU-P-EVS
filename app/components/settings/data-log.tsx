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
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

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
import { Skeleton } from "@/components/ui/skeleton";

// Types for our data
interface VoterLog {
  id: string;
  name: string;
  email: string;
  registeredAt: Date;
  status: string;
  election?: string;
  department?: string;
}

interface VoteLog {
  id: string;
  voter: string;
  voterEmail: string;
  election: string;
  position: string;
  votedAt: Date;
  status: string;
}

interface AdminLog {
  id: string;
  admin: string;
  action: string;
  target: string;
  performedAt: Date;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  performedAt: Date;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

// Define TableSkeleton component for tab content loading
function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-4 gap-4 pb-4 border-b">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="h-4 w-32 bg-muted rounded animate-pulse" />
          ))}
      </div>

      {/* Table Rows */}
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 py-4">
            <div className="h-8 w-40 bg-muted rounded animate-pulse" />
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-8 w-36 bg-muted rounded animate-pulse" />
          </div>
        ))}
    </div>
  );
}

export function DataLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("voters");

  // State for each tab's data
  const [voterLogs, setVoterLogs] = useState<VoterLog[]>([]);
  const [voteLogs, setVoteLogs] = useState<VoteLog[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string, tab: string} | null>(null);

  // Pagination states
  const [voterPagination, setVoterPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });
  const [votePagination, setVotePagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });
  const [adminPagination, setAdminPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });
  const [activityPagination, setActivityPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data based on active tab
  const fetchData = useCallback(
    async (tab: string, page: number = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search: debouncedSearchTerm,
          dateFilter,
          page: page.toString(),
          limit: "10",
        });

        let endpoint = "";
        switch (tab) {
          case "voters":
            endpoint = "/api/logs/voters";
            break;
          case "votes":
            endpoint = "/api/logs/votes";
            break;
          case "admin":
            endpoint = "/api/logs/admin";
            break;
          case "activity":
            endpoint = "/api/logs/activity";
            break;
          default:
            return;
        }

        const response = await fetch(`${endpoint}?${params}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              errorData.message ||
              `Failed to fetch data: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        // Update the appropriate state based on tab
        switch (tab) {
          case "voters":
            setVoterLogs(result.data);
            setVoterPagination(result.pagination);
            break;
          case "votes":
            setVoteLogs(result.data);
            setVotePagination(result.pagination);
            break;
          case "admin":
            setAdminLogs(result.data);
            setAdminPagination(result.pagination);
            break;
          case "activity":
            setActivityLogs(result.data);
            setActivityPagination(result.pagination);
            break;
        }
      } catch (error: any) {
        console.error(`Error fetching ${tab} data:`, error);
        setError({message: error.message || `An error occurred while fetching ${tab} data`, tab});
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearchTerm, dateFilter]
  );

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchData(activeTab);
  }, [fetchData, activeTab, debouncedSearchTerm, dateFilter]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle pagination
  const handlePageChange = (tab: string, page: number) => {
    fetchData(tab, page);
  };

  // Get current pagination based on active tab
  const getCurrentPagination = () => {
    switch (activeTab) {
      case "voters":
        return voterPagination;
      case "votes":
        return votePagination;
      case "admin":
        return adminPagination;
      case "activity":
        return activityPagination;
      default:
        return voterPagination;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "registered":
      case "counted":
        return "bg-green-100 text-green-800";
      case "inactive":
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
      case "voted":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const currentPagination = getCurrentPagination();

  // Export functionality
  const exportToCSV = () => {
    let csvContent = "";
    let headers = "";
    let rows = "";

    switch (activeTab) {
      case "voters":
        headers = "Name,Email,Registered Date,Status,Election\n";
        rows = voterLogs
          .map(
            (log) =>
              `"${log.name}","${log.email}","${format(new Date(log.registeredAt), "PPP")}","${log.status}","${log.election || "No election"}"`
          )
          .join("\n");
        break;
      case "votes":
        headers = "Voter,Email,Election,Position,Voted Date,Status\n";
        rows = voteLogs
          .map(
            (log) =>
              `"${log.voter}","${log.voterEmail}","${log.election}","${log.position}","${format(new Date(log.votedAt), "PPP")}","${log.status}"`
          )
          .join("\n");
        break;
      case "admin":
        headers = "Admin,Action,Target,Date & Time\n";
        rows = adminLogs
          .map(
            (log) =>
              `"${log.admin}","${log.action}","${log.target}","${format(new Date(log.performedAt), "PPP p")}"`
          )
          .join("\n");
        break;
      case "activity":
        headers = "User,Action,Date & Time\n"; // Removed IP Address column
        rows = activityLogs
          .map(
            (log) =>
              `"${log.user}","${log.action}","${format(new Date(log.performedAt), "PPP p")}"`
          )
          .join("\n");
        break;
    }

    csvContent = headers + rows;

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${activeTab}_logs_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // In the render function, add error display
  return (
    <div className="min-h-screen w-full max-w-[1200px] mx-auto p-4 space-y-6">
      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle>Data Logs</CardTitle>
          <CardDescription>
            View and manage system logs for voters, votes, admin actions, and
            general activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Search and Filter Bar */}
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
                <Button variant="outline" size="icon" onClick={exportToCSV}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error message display */}
            {error && error.tab === activeTab && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-destructive">
                <p className="font-medium">Error loading data:</p>
                <p>{error.message}</p>
                <p className="mt-2 text-sm">
                  Please check your database connection and environment
                  variables.
                </p>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                <TabsTrigger
                  value="activity"
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Activity</span>
                </TabsTrigger>
              </TabsList>

              {/* Update each tab content to show error state */}
              <TabsContent value="voters">
                {loading ? (
                  <TableSkeleton />
                ) : error && error.tab === "voters" ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Failed to load voter logs. {error.message}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registered Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Election</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voterLogs.length > 0 ? (
                        voterLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.name}
                            </TableCell>
                            <TableCell>{log.email}</TableCell>
                            <TableCell>
                              {format(new Date(log.registeredAt), "PPP")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(log.status)}
                              >
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {log.election || "No election"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No voter logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* Apply similar error handling to other tabs */}
              <TabsContent value="votes">
                {loading ? (
                  <TableSkeleton />
                ) : error && error.tab === "votes" ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Failed to load vote logs. {error.message}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Voter</TableHead>
                        <TableHead>Election</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Voted Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voteLogs.length > 0 ? (
                        voteLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{log.voter}</div>
                                <div className="text-sm text-muted-foreground">
                                  {log.voterEmail}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{log.election}</TableCell>
                            <TableCell>{log.position}</TableCell>
                            <TableCell>
                              {format(new Date(log.votedAt), "PPP")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(log.status)}
                              >
                                {log.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No vote logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="admin">
                {loading ? (
                  <TableSkeleton />
                ) : error && error.tab === "admin" ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Failed to load admin logs. {error.message}
                  </div>
                ) : (
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
                      {adminLogs.length > 0 ? (
                        adminLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.admin}
                            </TableCell>
                            <TableCell>{log.action}</TableCell>
                            <TableCell>{log.target}</TableCell>
                            <TableCell>
                              {format(new Date(log.performedAt), "PPP p")}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No admin logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="activity">
                {loading ? (
                  <TableSkeleton />
                ) : error && error.tab === "activity" ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Failed to load activity logs. {error.message}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        {/*
                        Removed IP Address column
                        */}
                        <TableHead>Date & Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.length > 0 ? (
                        activityLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.user}
                            </TableCell>
                            <TableCell>{log.action}</TableCell>
                            {/*
                            Removed IP Address cell
                            */}
                            <TableCell>
                              {format(new Date(log.performedAt), "PPP p")}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                          >
                            No activity logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

            </Tabs>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {currentPagination.totalCount} of{" "}
                {currentPagination.totalCount} entries
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPagination.currentPage === 1}
                  onClick={() =>
                    handlePageChange(
                      activeTab,
                      currentPagination.currentPage - 1
                    )
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-primary text-primary-foreground"
                >
                  {currentPagination.currentPage}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentPagination.hasMore}
                  onClick={() =>
                    handlePageChange(
                      activeTab,
                      currentPagination.currentPage + 1
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}