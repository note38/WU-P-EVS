import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditIcon, EyeIcon, TrashIcon } from "lucide-react";

interface Candidate {
  id: number;
  name: string;
  position: string;
  party: string;
  votes: number;
  avatar: string;
  department?: string;
  year?: string;
}

interface CandidatesTableProps {
  candidates: Candidate[];
  searchTerm: string;
}

export function CandidatesTable({
  candidates,
  searchTerm,
}: CandidatesTableProps) {
  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.party.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Department/Year</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={
                            candidate.avatar ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt={candidate.name}
                        />
                        <AvatarFallback>
                          {candidate.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>{candidate.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{candidate.position}</TableCell>
                  <TableCell>{candidate.party}</TableCell>
                  <TableCell>
                    {candidate.year && (
                      <>
                        <Badge variant="outline" className="mr-1">
                          {candidate.department || "N/A"}
                        </Badge>
                        <Badge variant="secondary">{candidate.year}</Badge>
                      </>
                    )}
                  </TableCell>
                  <TableCell>{candidate.votes.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <EyeIcon className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <EditIcon className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No candidates found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
