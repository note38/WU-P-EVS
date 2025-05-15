// app/admin_dashboard/voters/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import {
  VoterDataService,
  VoterData,
  AccelerateResult,
} from "@/lib/data/VoterDataService";
import {
  StatCardSkeleton,
  VoterCardsSkeleton,
} from "@/app/components/ui/skeleton";
import { CreateVoterForm } from "@/app/components/admin/voter-detail/create-voter-form";
import DepartmentCard from "@/app/components/admin/voter-detail/department-card";
import { prisma } from "@/lib/db";

// Define VoterStatus enum to match the one in DepartmentCard
enum VoterStatus {
  REGISTERED = "REGISTERED",
  VOTED = "VOTED",
}

// Cached voter data fetch with Accelerate
const getCachedVoters = unstable_cache(
  async (): Promise<AccelerateResult<VoterData[]>> => {
    return VoterDataService.getVoters();
  },
  ["all-voters"],
  {
    tags: ["voters"],
    revalidate: 10, // Short revalidation time
  }
);

// Fetch departments and years to get their proper relationships
const getCachedDepartmentsAndYears = unstable_cache(
  async () => {
    const departments = await prisma.department.findMany({
      include: {
        years: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return departments;
  },
  ["all-departments-and-years"],
  {
    tags: ["departments", "years"],
    revalidate: 60, // Cache for a minute
  }
);

// Async Components
async function DepartmentDisplay() {
  try {
    const { data: votersData = [], info } = await getCachedVoters();
    const departments = await getCachedDepartmentsAndYears();

    // Create a mapping from year ID to department and year names
    const yearMapping = new Map();
    departments.forEach((dept) => {
      dept.years.forEach((year) => {
        yearMapping.set(year.id, {
          departmentName: dept.name,
          departmentId: dept.id,
          yearName: year.name,
          yearId: year.id,
          // Use department image if available
          departmentImage: dept.image || null,
        });
      });
    });

    // Map VoterData to the Voter format expected by DepartmentCard with enhanced data
    const voters = votersData.map((voter) => {
      const yearInfo = yearMapping.get(voter.year.id);
      const yearFullName = yearInfo
        ? `${yearInfo.yearName} - ${yearInfo.departmentName}`
        : voter.year.name;

      return {
        ...voter,
        // Ensure status is properly typed as VoterStatus
        status: voter.status as unknown as VoterStatus,
        // Enhance year data with department relationship
        year: {
          ...voter.year,
          name: yearFullName,
          departmentName: yearInfo?.departmentName || "Unknown",
          departmentId: yearInfo?.departmentId || 0,
          departmentImage: yearInfo?.departmentImage || null,
        },
      };
    });

    return (
      <DepartmentCard
        voters={voters}
        info={info}
        departmentsData={departments}
      />
    );
  } catch (error) {
    console.error("Error fetching voters:", error);
    // Return empty state with error message
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">
          Failed to load voter data. Please try again later.
        </p>
      </div>
    );
  }
}

// Page Config - these settings help prevent caching at the page level
export const dynamic = "force-dynamic";
export const revalidate = 0; // Set to 0 to prevent caching

// Server action to handle revalidation - can be called from client components
export async function refreshVotersData() {
  "use server";

  // Import revalidateTag inside server action to avoid mixing client/server code
  const { revalidateTag } = await import("next/cache");
  revalidateTag("voters");
  revalidateTag("departments");
  revalidateTag("years");
}

// Main Page - Server Component
export default function VotersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Voters Management</h1>

        <div className="hidden md:block">
          <CreateVoterForm />
        </div>

        {/* Mobile button - hidden on desktop */}
        <div className="block md:hidden w-full">
          <CreateVoterForm />
        </div>
      </div>

      <Card>
        <CardContent>
          <Suspense fallback={<VoterCardsSkeleton />}>
            <DepartmentDisplay />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
