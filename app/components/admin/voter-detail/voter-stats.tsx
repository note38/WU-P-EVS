import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, UserCheckIcon, UserXIcon, MailIcon } from "lucide-react";

export function VoterStats() {
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
          <div className="text-2xl font-bold">5,000</div>
          <p className="text-xs text-muted-foreground">+120 from last week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Voted</CardTitle>
          <UserCheckIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">4,195</div>
          <p className="text-xs text-muted-foreground">
            83.9% of registered voters
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Not Voted</CardTitle>
          <UserXIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">805</div>
          <p className="text-xs text-muted-foreground">
            16.1% of registered voters
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
          <div className="text-2xl font-bold">4,850</div>
          <p className="text-xs text-muted-foreground">
            97% of registered voters
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
