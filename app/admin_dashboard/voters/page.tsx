// app/admin_dashboard/voters/page.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import {
  VoterDataService,
  VoterData,
  AccelerateResult,
} from "@/lib/data/VoterDataService";
import {
  StatCardSkeleton,
  DepartmentCardSkeleton,
} from "@/app/components/ui/skeleton";
import { CreateVoterForm } from "@/app/components/admin/voter-detail/create-voter-form";
import DepartmentCard from "@/app/components/admin/voter-detail/department-card";
import { ExportButtons } from "@/app/components/admin/voter-detail/export-buttons";
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
    revalidate: 10,
  }
);

// Fetch departments and years
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
    revalidate: 60,
  }
);

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

// Async Server Components
async function HeaderWithActions() {
  const { data: votersData = [] } = await getCachedVoters();
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
        departmentImage: dept.image || null,
      });
    });
  });

  // Map VoterData to the Voter format for export
  const mappedVoters = votersData.map((voter) => {
    const yearInfo = voter.year ? yearMapping.get(voter.year.id) : null;
    const yearFullName = yearInfo
      ? `${yearInfo.yearName} - ${yearInfo.departmentName}`
      : voter.year?.name || "Unknown Year";

    return {
      ...voter,
      status: voter.status as unknown as VoterStatus,
      year: voter.year
        ? {
            ...voter.year,
            name: yearFullName,
            departmentName: yearInfo?.departmentName || "Unknown",
            departmentId: yearInfo?.departmentId || 0,
            departmentImage: yearInfo?.departmentImage || null,
          }
        : {
            id: 0,
            name: "Unknown Year",
            departmentName: "Unknown",
            departmentId: 0,
            departmentImage: null,
          },
      election: voter.election || { name: "No Election", id: 0 },
    };
  });

  return <PageHeader voters={mappedVoters} departments={departments} />;
}

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
          departmentImage: dept.image || null,
        });
      });
    });

    // Map VoterData to the expected format with proper department relationships
    const mappedVoters = votersData.map((voter) => {
      const yearInfo = voter.year ? yearMapping.get(voter.year.id) : null;
      const yearFullName = yearInfo
        ? `${yearInfo.yearName} - ${yearInfo.departmentName}`
        : voter.year?.name || "Unknown Year";

      return {
        ...voter,
        status: voter.status as unknown as VoterStatus,
        year: voter.year
          ? {
              ...voter.year,
              name: yearFullName,
              departmentName: yearInfo?.departmentName || "Unknown",
              departmentId: yearInfo?.departmentId || 0,
              departmentImage: yearInfo?.departmentImage || null,
            }
          : {
              id: 0,
              name: "Unknown Year",
              departmentName: "Unknown",
              departmentId: 0,
              departmentImage: null,
            },
        election: voter.election || { name: "No Election", id: 0 },
      };
    });

    return (
      <DepartmentCard
        voters={mappedVoters}
        info={info}
        departmentsData={departments}
      />
    );
  } catch (error) {
    console.error("Error fetching voters:", error);
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">
          Failed to load voter data. Please try again later.
        </p>
      </div>
    );
  }
}

// Page Config
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Main Page Component
export default function VotersPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DepartmentCardSkeleton />}>
        <HeaderWithActions />
      </Suspense>

      <Card>
        <CardContent>
          <Suspense fallback={<DepartmentCardSkeleton />}>
            <DepartmentDisplay />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
