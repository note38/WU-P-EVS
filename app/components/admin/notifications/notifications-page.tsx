"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  CheckCircle,
  Mail,
  Megaphone,
  Users,
  Eye,
  EyeOff,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNotifications, type Notification } from "@/hooks/use-notifications";

function getTimeAgo(date: string) {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - notificationDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return notificationDate.toLocaleDateString();
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getNotificationIcon: (type: Notification["type"]) => React.ReactNode;
  getPriorityColor: (priority: Notification["priority"]) => string;
  getTypeColor: (type: Notification["type"]) => string;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  getNotificationIcon,
  getPriorityColor,
  getTypeColor,
}: NotificationItemProps) {
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div
      className={`p-4 hover:bg-muted/50 transition-colors ${
        !notification.isRead
          ? "bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
          : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`font-semibold text-sm ${
                    !notification.isRead
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {notification.title}
                </h3>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
              <p
                className={`text-sm ${
                  !notification.isRead
                    ? "text-foreground"
                    : "text-muted-foreground"
                } mb-2`}
              >
                {notification.message}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={getPriorityColor(notification.priority) as any}
                  className="text-xs"
                >
                  {notification.priority.charAt(0).toUpperCase() +
                    notification.priority.slice(1)}{" "}
                  Priority
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {notification.type.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </div>
              </div>

              {/* Additional Data Display */}
              {notification.data && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md">
                  {notification.type === "credential" &&
                    notification.data.voterCount && (
                      <p className="text-xs text-muted-foreground">
                        📊 {notification.data.voterCount} voters affected
                        {notification.data.electionName &&
                          ` • Election: ${notification.data.electionName}`}
                      </p>
                    )}
                  {notification.type === "election" &&
                    notification.data.electionName && (
                      <p className="text-xs text-muted-foreground">
                        🗳️ Election: {notification.data.electionName}
                        {notification.data.hoursRemaining &&
                          ` • ${notification.data.hoursRemaining} hours remaining`}
                      </p>
                    )}
                  {notification.type === "announcement" &&
                    notification.data.maintenanceDate && (
                      <p className="text-xs text-muted-foreground">
                        🔧 Maintenance: {notification.data.maintenanceDate}{" "}
                        {notification.data.startTime} -{" "}
                        {notification.data.endTime}
                      </p>
                    )}
                  {notification.type === "announcement" &&
                    notification.data.feature && (
                      <p className="text-xs text-muted-foreground">
                        ✨ New Feature: {notification.data.feature}
                      </p>
                    )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                disabled={notification.isRead}
                className="h-8 w-8 p-0"
                title={notification.isRead ? "Already read" : "Mark as read"}
              >
                {notification.isRead ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                title="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<
    "all" | "unread" | "credential" | "election" | "announcement"
  >("all");

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "credential":
        return <Mail className="h-4 w-4" />;
      case "election":
        return <Users className="h-4 w-4" />;
      case "announcement":
        return <Megaphone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "credential":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "election":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "announcement":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.isRead;
    return notification.type === filter;
  });

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read.",
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read.",
    });
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
    toast({
      title: "Notification deleted",
      description: "The notification has been deleted.",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "All notifications read"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter notifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="credential">Voter Credentials</SelectItem>
            <SelectItem value="election">Election Reminders</SelectItem>
            <SelectItem value="announcement">Announcements</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-sm">
          {filteredNotifications.length} notifications
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Credentials Sent
                </p>
                <p className="text-lg font-semibold">
                  {notifications.filter((n) => n.type === "credential").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Election Updates
                </p>
                <p className="text-lg font-semibold">
                  {notifications.filter((n) => n.type === "election").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Announcements</p>
                <p className="text-lg font-semibold">
                  {
                    notifications.filter((n) => n.type === "announcement")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            Stay updated with voter credentials, election reminders, and system
            announcements.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No notifications found
              </h3>
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "All notifications have been read"
                  : "No notifications match your current filter"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                  getNotificationIcon={getNotificationIcon}
                  getPriorityColor={getPriorityColor}
                  getTypeColor={getTypeColor}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
