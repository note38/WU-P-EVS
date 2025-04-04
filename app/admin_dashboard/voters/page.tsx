import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon } from "lucide-react";
import VoterCards from "@/app/components/admin/voter-detail/voter-card";
import { VoterStatsWithAccelerate } from "@/app/components/admin/voter-detail/voter-stats";
import { VoterActions } from "@/app/components/admin/voter-detail/voter-actions";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import {
  VoterDataService,
  VoterData,
  AccelerateResult,
} from "@/lib/data/VoterDataService";
import {
  Skeleton,
  StatCardSkeleton,
  VoterCardsSkeleton,
} from "@/app/components/ui/skeleton";
import { CreateVoterForm } from "@/app/components/admin/voter-detail/create-voter-form";

// Cached voter data fetch with Accelerate
const getCachedVoters = unstable_cache(
  async (): Promise<AccelerateResult<VoterData[]>> => {
    return VoterDataService.getVoters();
  },
  ["all-voters"],
  { tags: ["voters"], revalidate: 60 }
);

// Async Components
async function VoterList() {
  const result = await getCachedVoters();
  return <VoterCards voters={result.data} info={result.info} />;
}

// Page Config
export const dynamic = "force-dynamic";
export const revalidate = 60;

// Main Page
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

      <Suspense fallback={<StatCardSkeleton />}>
        <VoterStatsWithAccelerate />
      </Suspense>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>All Voters</CardTitle>
          <div className="w-full sm:w-auto">
            <VoterActions />
          </div>
        </CardHeader>

        <CardContent>
          <Suspense fallback={<VoterCardsSkeleton />}>
            <VoterList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
