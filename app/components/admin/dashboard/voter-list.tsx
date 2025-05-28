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

interface VoterListProps {
  voters: RecentVoter[];
}

// Function to generate avatar for voters
function getVoterAvatar(voterId: number, voterName: string) {
  const styles = ["avataaars"];
  const style = styles[voterId % styles.length];
  const seed = voterName.toLowerCase().replace(/\s+/g, "");
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
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
                    <img
                      src={getVoterAvatar(voter.id, voter.name)}
                      alt={`Avatar for ${voter.name}`}
                      className="h-full w-full object-cover"
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
