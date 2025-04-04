import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, UserCheckIcon, UserXIcon, MailIcon } from "lucide-react";
import { unstable_cache } from "next/cache";
import {
  VoterDataService,
  StatsResult,
  AccelerateResult,
} from "@/lib/data/VoterDataService";

// Cached stats fetch with Accelerate
const getCachedStats = unstable_cache(
  async (): Promise<AccelerateResult<StatsResult>> => {
    return VoterDataService.getStats();
  },
  ["voter-stats-accelerated"],
  { tags: ["stats"], revalidate: 60 }
);

export async function VoterStatsWithAccelerate() {
  const result = await getCachedStats();
  const stats = result.data;

  // Calculate percentages
  const votedPercentage =
    stats.totalRegistered > 0
      ? ((stats.votedCount / stats.totalRegistered) * 100).toFixed(1)
      : "0.0";

  const notVotedPercentage =
    stats.totalRegistered > 0
      ? ((stats.notVotedCount / stats.totalRegistered) * 100).toFixed(1)
      : "0.0";

  const credentialsSentPercentage =
    stats.totalRegistered > 0
      ? ((stats.credentialsSentCount / stats.totalRegistered) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Registered
          </CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalRegistered.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            +{stats.newRegistrations} from last week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Voted</CardTitle>
          <UserCheckIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.votedCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {votedPercentage}% of registered voters
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Not Voted</CardTitle>
          <UserXIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.notVotedCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {notVotedPercentage}% of registered voters
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Credentials Sent
          </CardTitle>
          <MailIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.credentialsSentCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {credentialsSentPercentage}% of registered voters
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
