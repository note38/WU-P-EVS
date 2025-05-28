import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { BarChart2, CalendarIcon, CheckCircle, PieChart } from "lucide-react";
import { unstable_cache } from "next/cache";

type StatsResult = {
  totalElections: number;
  activeElections: number;
  completedElections: number;
  totalVoters: number;
};

// Cached stats fetch
const getElectionStats = unstable_cache(
  async (): Promise<StatsResult> => {
    const [totalElections, activeElections, completedElections, totalVoters] =
      await Promise.all([
        prisma.election.count(),
        prisma.election.count({
          where: { status: "ACTIVE" },
        }),
        prisma.election.count({
          where: { status: "COMPLETED" },
        }),
        prisma.voter.count(),
      ]);

    return {
      totalElections,
      activeElections,
      completedElections,
      totalVoters,
    };
  },
  ["election-stats"],
  { tags: ["election-stats"], revalidate: 60 }
);

export async function ElectionStats() {
  const stats = await getElectionStats();

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
