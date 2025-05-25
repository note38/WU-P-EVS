import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// Global avatar state
let globalAvatarState: {
  avatar: string | null;
  listeners: Set<(avatar: string | null) => void>;
} = {
  avatar: null,
  listeners: new Set(),
};

export function useUserAvatar() {
  const { data: session } = useSession();
  // Always start with null to ensure server/client consistency
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true);
    // Only set the global state after mounting to avoid hydration mismatch
    setAvatar(globalAvatarState.avatar);
  }, []);

  // Subscribe to global state changes
  useEffect(() => {
    if (!isMounted) return;

    const listener = (newAvatar: string | null) => {
      setAvatar(newAvatar);
    };

    globalAvatarState.listeners.add(listener);

    return () => {
      globalAvatarState.listeners.delete(listener);
    };
  }, [isMounted]);

  // Fetch avatar when session changes
  useEffect(() => {
    if (!isMounted) return;

    async function fetchAvatar() {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch("/api/users/profile", {
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const newAvatar = userData.avatar || null;

          // Update global state
          globalAvatarState.avatar = newAvatar;

          // Notify all listeners
          globalAvatarState.listeners.forEach((listener) =>
            listener(newAvatar)
          );
        }
      } catch (error) {
        console.error("Failed to fetch user avatar:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAvatar();
  }, [session?.user, isMounted]);

  // Function to update avatar globally
  const updateAvatar = useCallback((newAvatar: string | null) => {
    globalAvatarState.avatar = newAvatar;
    globalAvatarState.listeners.forEach((listener) => listener(newAvatar));
  }, []);

  // Function to refresh avatar from server
  const refreshAvatar = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/users/profile", {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const newAvatar = userData.avatar || null;
        updateAvatar(newAvatar);
      }
    } catch (error) {
      console.error("Failed to refresh user avatar:", error);
    }
  }, [session?.user, updateAvatar]);

  return {
    avatar,
    isLoading,
    updateAvatar,
    refreshAvatar,
  };
}
