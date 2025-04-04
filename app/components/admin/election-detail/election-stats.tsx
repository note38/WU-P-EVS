import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, BarChart2, CalendarIcon, CheckCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { AccelerateInfo } from "@prisma/extension-accelerate";

type StatsResult = {
  totalElections: number;
  activeElections: number;
  completedElections: number;
  totalVoters: number;
};

type StatsWithAccelerate = {
  data: StatsResult;
  info: AccelerateInfo | null;
};

// Cached stats fetch with Accelerate
const getAcceleratedElectionStats = unstable_cache(
  async (): Promise<StatsWithAccelerate> => {
    const [totalElections, activeElections, completedElections, totalVoters] =
      await Promise.all([
        prisma.election.count().withAccelerateInfo(),
        prisma.election
          .count({
            where: { status: "ACTIVE" },
          })
          .withAccelerateInfo(),
        prisma.election
          .count({
            where: { status: "COMPLETED" },
          })
          .withAccelerateInfo(),
        prisma.voter.count().withAccelerateInfo(),
      ]);

    return {
      data: {
        totalElections: totalElections.data,
        activeElections: activeElections.data,
        completedElections: completedElections.data,
        totalVoters: totalVoters.data,
      },
      info:
        totalElections.info ||
        activeElections.info ||
        completedElections.info ||
        totalVoters.info,
    };
  },
  ["election-stats-accelerated"],
  { tags: ["election-stats"], revalidate: 60 }
);

export async function ElectionStats() {
  const result = await getAcceleratedElectionStats();
  const stats = result.data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Elections</CardTitle>
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalElections}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Active Elections
          </CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeElections}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Elections
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedElections}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVoters}</div>
        </CardContent>
      </Card>
    </div>
  );
}
