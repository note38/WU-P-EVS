import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  type: "credential" | "election" | "announcement";
  title: string;
  message: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  data?: any;
}

// Global notification state
let globalNotificationState: {
  notifications: Notification[];
  listeners: Set<(notifications: Notification[]) => void>;
  isInitialized: boolean;
} = {
  notifications: [],
  listeners: new Set(),
  isInitialized: false,
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Subscribe to global state changes
  useEffect(() => {
    if (!isClient) return;

    const listener = (newNotifications: Notification[]) => {
      setNotifications(newNotifications);
    };

    globalNotificationState.listeners.add(listener);

    // If already initialized, sync immediately
    if (globalNotificationState.isInitialized) {
      setNotifications(globalNotificationState.notifications);
      setIsLoading(false);
    }

    return () => {
      globalNotificationState.listeners.delete(listener);
    };
  }, [isClient]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isClient) return;

    try {
      setIsLoading(true);

      // Create consistent timestamps for hydration
      const baseTime = new Date("2024-01-15T10:00:00Z").getTime();

      // In a real app, this would be an API call
      // For now, we'll use mock data with consistent timestamps
      const mockNotifications: Notification[] = [
        {
          id: "1",
          type: "credential",
          title: "Voter Credentials Sent",
          message:
            "Successfully sent login credentials to 45 new voters for the upcoming Student Council Election.",
          isRead: false,
          priority: "high",
          createdAt: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(), // 2 hours before base
          data: { voterCount: 45, electionName: "Student Council Election" },
        },
        {
          id: "2",
          type: "election",
          title: "Election Reminder",
          message:
            "Student Council Election voting period starts in 24 hours. Ensure all preparations are complete.",
          isRead: false,
          priority: "high",
          createdAt: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(), // 4 hours before base
          data: {
            electionName: "Student Council Election",
            hoursRemaining: 24,
          },
        },
        {
          id: "3",
          type: "announcement",
          title: "System Maintenance Scheduled",
          message:
            "Scheduled maintenance on Sunday 2:00 AM - 4:00 AM. The system will be temporarily unavailable.",
          isRead: false,
          priority: "medium",
          createdAt: new Date(baseTime - 24 * 60 * 60 * 1000).toISOString(), // 1 day before base
          data: {
            maintenanceDate: "Sunday",
            startTime: "2:00 AM",
            endTime: "4:00 AM",
          },
        },
      ];

      // Update global state
      globalNotificationState.notifications = mockNotifications;
      globalNotificationState.isInitialized = true;

      // Notify all listeners
      globalNotificationState.listeners.forEach((listener) =>
        listener(mockNotifications)
      );
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isClient]);

  // Mark notification as read
  const markAsRead = useCallback(
    (id: string) => {
      if (!isClient) return;

      const updatedNotifications = globalNotificationState.notifications.map(
        (n) => (n.id === id ? { ...n, isRead: true } : n)
      );

      globalNotificationState.notifications = updatedNotifications;
      globalNotificationState.listeners.forEach((listener) =>
        listener(updatedNotifications)
      );
    },
    [isClient]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    if (!isClient) return;

    const updatedNotifications = globalNotificationState.notifications.map(
      (n) => ({ ...n, isRead: true })
    );

    globalNotificationState.notifications = updatedNotifications;
    globalNotificationState.listeners.forEach((listener) =>
      listener(updatedNotifications)
    );
  }, [isClient]);

  // Delete notification
  const deleteNotification = useCallback(
    (id: string) => {
      if (!isClient) return;

      const updatedNotifications = globalNotificationState.notifications.filter(
        (n) => n.id !== id
      );

      globalNotificationState.notifications = updatedNotifications;
      globalNotificationState.listeners.forEach((listener) =>
        listener(updatedNotifications)
      );
    },
    [isClient]
  );

  // Add new notification
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "createdAt">) => {
      if (!isClient) return;

      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      const updatedNotifications = [
        newNotification,
        ...globalNotificationState.notifications,
      ];

      globalNotificationState.notifications = updatedNotifications;
      globalNotificationState.listeners.forEach((listener) =>
        listener(updatedNotifications)
      );
    },
    [isClient]
  );

  // Get unread count (safe for SSR)
  const unreadCount = isClient
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  // Initialize on client mount
  useEffect(() => {
    if (isClient && !globalNotificationState.isInitialized) {
      fetchNotifications();
    }
  }, [isClient, fetchNotifications]);

  return {
    notifications,
    isLoading: isClient ? isLoading : true,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    refetch: fetchNotifications,
  };
}
