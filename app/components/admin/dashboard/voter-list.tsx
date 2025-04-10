// File: src/components/Dashboard/VoterList.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Voter } from "./moc-data";

interface VoterListProps {
  voters: Voter[];
}

export default function VoterList({ voters }: VoterListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Voters</CardTitle>
        <CardDescription>People who recently cast their votes</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {voters.map((voter) => (
              <div
                key={voter.id}
                className="flex justify-between border-b pb-2"
              >
                <p className="font-medium">{voter.name}</p>
                <p className="text-sm text-muted-foreground">{voter.time}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
