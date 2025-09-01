import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export interface DatabaseUser {
  id: number;
  clerkId: string;
  email: string;
  role: "ADMIN" | "VOTER";
  userType: "admin" | "voter";
  // Admin specific fields
  username?: string;
  avatar?: string;
  // Voter specific fields
  firstName?: string;
  lastName?: string;
  status?: "REGISTERED" | "VOTED";
  electionId?: number;
  yearId?: number;
}

export function useClerkAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [databaseUser, setDatabaseUser] = useState<DatabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatabaseUser = async () => {
      if (!isLoaded) return;

      if (!isSignedIn || !user) {
        setDatabaseUser(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Use the API endpoint instead of direct server function
        const response = await fetch("/api/auth/get-user");

        if (response.ok) {
          const userData = await response.json();
          setDatabaseUser(userData);
        } else if (response.status === 404) {
          setError("User not found in database");
        } else {
          setError("Failed to load user data");
        }
      } catch (err) {
        console.error("Error fetching database user:", err);
        setError("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatabaseUser();
  }, [user, isLoaded, isSignedIn]);

  return {
    user: databaseUser,
    clerkUser: user,
    isLoaded,
    isSignedIn,
    isLoading,
    error,
    isAdmin: databaseUser?.userType === "admin",
    isVoter: databaseUser?.userType === "voter",
  };
}

export function useCustomSignOut() {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      // Sign out - will redirect to "/" as configured in clerk.ts
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback redirect
      window.location.href = "/";
    }
  };

  return { handleSignOut };
}
