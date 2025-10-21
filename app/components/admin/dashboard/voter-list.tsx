// File: src/components/Dashboard/VoterList.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecentVoter } from "@/lib/data/dashboard";
import { UserAvatarSvg } from "@/app/components/ui/user-avatar-svg";

interface VoterListProps {
  voters: RecentVoter[];
}

export default function VoterList({ voters }: VoterListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Voters</CardTitle>
        <CardDescription>Recently added voters to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {voters.map((voter) => (
              <div
                key={voter.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full border">
                    <UserAvatarSvg
                      name={voter.name}
                      size={32}
                      className="h-full w-full"
                    />
                  </div>
                  <p className="font-medium">{voter.name}</p>
                </div>
                <p className="text-sm text-muted-foreground">{voter.time}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}