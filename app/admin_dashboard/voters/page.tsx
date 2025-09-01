"use client";

// app/admin_dashboard/voters/page.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Suspense, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  VoterDataService,
  AccelerateResult,
} from "@/lib/data/VoterDataService";

// Define the correct VoterData type that matches the API response
type VoterData = {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  status: "REGISTERED" | "VOTED";
  avatar: string;
  credentialsSent: boolean;
  createdAt: Date;
  election: {
    name: string;
    id: number;
  } | null;
  year: {
    name: string;
    id: number;
    department: {
      id: number;
      name: string;
      image: string | null;
    };
  } | null;
};
import {
  StatCardSkeleton,
  DepartmentCardSkeleton,
} from "@/app/components/ui/skeleton";
import { CreateVoterForm } from "@/app/components/admin/voter-detail/create-voter-form";
import DepartmentCard from "@/app/components/admin/voter-detail/department-card";
import { ExportButtons } from "@/app/components/admin/voter-detail/export-buttons";

// Define VoterStatus enum to match the one in DepartmentCard
enum VoterStatus {
  REGISTERED = "REGISTERED",
  VOTED = "VOTED",
}

type Department = {
  id: number;
  name: string;
  image: string | null;
  years: Array<{
    id: number;
    name: string;
  }>;
};

// Client Components
function PageHeader({
  voters,
  departments,
}: {
  voters: any[];
  departments: any[];
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Voters Management</h1>
      <div className="flex flex-col sm:flex-row gap-2">
        <ExportButtons voters={voters} title="All Voters Report" />
        <div className="hidden md:block">
          <CreateVoterForm />
        </div>
        <div className="block md:hidden w-full">
          <CreateVoterForm />
        </div>
      </div>
    </div>
  );
}

// Main Voters Page Component
export default function VotersPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [votersData, setVotersData] = useState<VoterData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Wait for Clerk to load and check authentication
      if (!isLoaded) {
        console.log("Clerk is still loading...");
        return;
      }

      if (!isSignedIn || !user) {
        console.log("User not signed in or user object not available");
        setError("Please sign in to access this page");
        setLoading(false);
        return;
      }

      console.log(
        "User authenticated:",
        user?.id,
        "Email:",
        user?.emailAddresses?.[0]?.emailAddress
      );
      try {
        setLoading(true);

        // Fetch voters data
        const votersResponse = await fetch("/api/voters");
        const departmentsResponse = await fetch("/api/admin/departments");

        console.log("Voters response status:", votersResponse.status);
        console.log("Departments response status:", departmentsResponse.status);

        if (votersResponse.ok && departmentsResponse.ok) {
          const voters = await votersResponse.json();
          const depts = await departmentsResponse.json();

          console.log("Voters data:", voters);
          console.log("Departments data:", depts);

          // Debug: Check the first voter's year and department structure
          if (voters.data && voters.data.length > 0) {
            const firstVoter = voters.data[0];
            console.log("First voter structure:", {
              id: firstVoter.id,
              name: `${firstVoter.firstName} ${firstVoter.lastName}`,
              year: firstVoter.year,
              department: firstVoter.year?.department,
            });
          }

          setVotersData(voters.data || []);
          setDepartments(depts);
        } else {
          // Handle errors properly
          let votersError = "Unknown error";
          let departmentsError = "Unknown error";

          try {
            if (!votersResponse.ok) {
              const votersErrorData = await votersResponse.json();
              votersError =
                votersErrorData.error ||
                votersErrorData.message ||
                `HTTP ${votersResponse.status}`;
            }
          } catch {
            votersError =
              (await votersResponse.text()) || `HTTP ${votersResponse.status}`;
          }

          try {
            if (!departmentsResponse.ok) {
              const departmentsErrorData = await departmentsResponse.json();
              departmentsError =
                departmentsErrorData.error ||
                departmentsErrorData.message ||
                `HTTP ${departmentsResponse.status}`;
            }
          } catch {
            departmentsError =
              (await departmentsResponse.text()) ||
              `HTTP ${departmentsResponse.status}`;
          }

          console.error("Voters error:", votersError);
          console.error("Departments error:", departmentsError);
          setError(
            `Failed to load data: Voters - ${votersError}, Departments - ${departmentsError}`
          );
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, isSignedIn, user?.id]);

  if (!isLoaded || loading) {
    return <StatCardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg text-red-500">{error}</p>
        {error === "Please sign in to access this page" && (
          <p className="text-sm text-gray-600 mt-2">
            Please sign in with your admin account to view voter data.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader voters={votersData} departments={departments} />

      {/* Department Cards - Pass all voters to let the component handle grouping */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <Suspense fallback={<DepartmentCardSkeleton />}>
            <DepartmentCard voters={votersData} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
