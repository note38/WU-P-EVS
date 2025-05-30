import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="h-[125px] w-full rounded-xl" />
        ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
    </div>
  );
}

export function VoterCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <CardSkeleton key={i} />
        ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-[200px]" />
      <div className="space-y-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
      </div>
      <Skeleton className="h-10 w-[100px]" />
    </div>
  );
}

export function OverviewSkeleton() {
  return <div className="h-[300px] w-full rounded-md bg-muted animate-pulse" />;
}

export function RecentActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
    </div>
  );
}

export function TabContentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-[180px]" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ElectionCardsSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <Card key={i} className="h-[280px]">
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-6 w-[160px] mb-2" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[120px] mt-1" />
                </div>
                <Skeleton className="h-6 w-[80px] rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

export function ElectionStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <Card key={i} className="h-[120px]">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-[140px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[80px] mb-2" />
              <Skeleton className="h-4 w-[120px]" />
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

export function SettingsProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Card Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[80px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[240px]" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-[120px] rounded-md" />
              <Skeleton className="h-9 w-[80px] rounded-md" />
            </div>
            <Skeleton className="h-3 w-[280px]" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[60px]" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[50px]" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-[220px]" />
            </div>
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </CardContent>
      </Card>

      {/* Password Card Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[80px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[280px]" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-10 w-full" />
                  {i === 1 && <Skeleton className="h-3 w-[320px]" />}
                </div>
              ))}
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-[120px]" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-[200px]" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[80px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Form Card */}
      <SettingsFormSkeleton />

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[160px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[240px]" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-4 w-[80px]" />
                ))}
            </div>

            {/* Table Rows */}
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 py-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsAccountSkeleton() {
  return (
    <div className="space-y-6">
      {/* Create Admin Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[180px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[280px]" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[40px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-[180px]" />
        </CardFooter>
      </Card>

      {/* Admin Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[140px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[200px]" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 pb-2 border-b border-border">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-4 w-[60px]" />
                ))}
            </div>

            {/* Table Rows */}
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 py-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsDataLogsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-[100px]" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-[300px]" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex gap-4">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-4 w-[80px]" />
              ))}
          </div>

          {/* Table Rows */}
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[90px]" />
              </div>
            ))}

          {/* Pagination */}
          <div className="flex justify-between items-center pt-4">
            <Skeleton className="h-4 w-[120px]" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DepartmentCardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Voters Management</h1>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[100px] rounded-md" />{" "}
          {/* Print button */}
          <Skeleton className="h-10 w-[100px] rounded-md" />{" "}
          {/* Export button */}
          <Skeleton className="h-10 w-[120px] rounded-md" />{" "}
          {/* Add Voter button */}
        </div>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card
              key={i}
              className="relative bg-card/30 border-primary/20 overflow-hidden"
            >
              {/* Top colored border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>

              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-1" />
                    <Skeleton className="h-4 w-40 text-muted-foreground" />
                  </div>
                  <Skeleton className="h-6 w-8 rounded-lg" />
                </div>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 ml-auto" />
                </div>
              </CardContent>

              <CardFooter className="border-t border-border/50 bg-muted/10 px-6 py-2">
                <Skeleton className="h-3 w-24 text-muted-foreground" />
                <Skeleton className="h-3 w-32 ml-auto text-muted-foreground" />
              </CardFooter>
            </Card>
          ))}
      </div>

      {/* Year Levels Section */}
      <Card className="border-primary/20 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-64" />
              </div>
              <Skeleton className="h-4 w-48 text-muted-foreground" />
            </div>
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="relative bg-card/30 border-primary/20">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-emerald-100">
                          <Skeleton className="h-4 w-4" />
                        </div>
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-6 w-8 rounded-lg" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Voters Section */}
      <Card className="border-primary/20 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-emerald-100">
                  <Skeleton className="h-5 w-5" />
                </div>
                <Skeleton className="h-6 w-72" />
              </div>
              <Skeleton className="h-4 w-48 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Card
                  key={i}
                  className="overflow-hidden bg-card/30 border-primary/20"
                >
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-4 w-24 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
