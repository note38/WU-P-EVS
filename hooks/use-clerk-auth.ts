import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

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
  const { signOut } = useClerk();
  const router = useRouter();
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
          // User not found in database - redirect to sign-in with error message
          setError("Email not registered in system");
          
          // Show error message
          toast({
            title: "Access Denied",
            description: "This email is not registered in our system. Please try with a different email or contact an administrator.",
            variant: "destructive",
          });

          // Sign out and redirect to sign-in page with error context
          setTimeout(async () => {
            try {
              await signOut();
              router.push("/sign-in?error=email_not_registered&message=This email is not registered in our system");
            } catch (signOutError) {
              console.error("Error during sign out:", signOutError);
              // Fallback redirect
              window.location.href = "/sign-in?error=email_not_registered";
            }
          }, 2000);
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
  }, [user, isLoaded, isSignedIn, signOut, router]);

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
