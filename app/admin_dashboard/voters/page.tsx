import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusIcon,
  PrinterIcon,
  SendIcon,
  UsersIcon,
  FilterIcon,
  MoreHorizontal,
} from "lucide-react";
import VoterCards from "@/app/components/admin/voter-detail/voter-card";
import { VoterStats } from "@/app/components/admin/voter-detail/voter-stats";
import { VoterActions } from "@/app/components/admin/voter-detail/voter-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { prisma } from "@/lib/db";

export default async function VotersPage() {
  const voters = await prisma.voter.findMany({
    select: {
      id: true,
      voterId: true,
      firstName: true,
      lastName: true,
      middleName: true,
      email: true,
      status: true,
      avatar: true,
      credentialsSent: true,
      createdAt: true,
      election: {
        select: {
          name: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Voters Management</h1>

        {/* Desktop buttons - hidden on mobile */}
        <div className="hidden md:flex gap-2">
          <Button variant="outline" size="sm">
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print Voters
          </Button>
          <Button variant="outline" size="sm">
            <SendIcon className="mr-2 h-4 w-4" />
            Send Credentials
          </Button>
          <Button variant="outline" size="sm">
            <UsersIcon className="mr-2 h-4 w-4" />
            Migrate Voters
          </Button>
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Voter
          </Button>
        </div>

        {/* Tablet buttons - hidden on desktop and mobile */}
        <div className="hidden sm:flex md:hidden gap-2">
          <Button variant="outline" size="sm">
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <SendIcon className="mr-2 h-4 w-4" />
            Send
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="mr-2 h-4 w-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UsersIcon className="mr-2 h-4 w-4" />
                Migrate Voters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>

        {/* Mobile action buttons */}
        <div className="flex sm:hidden items-center justify-between w-full">
          <Button variant="outline" size="sm">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print Voters
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SendIcon className="mr-2 h-4 w-4" />
                  Send Credentials
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Migrate Voters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>All Voters</CardTitle>
          <div className="w-full sm:w-auto">
            <VoterActions />
          </div>
        </CardHeader>
        <CardContent>
          <VoterCards voters={voters} />
        </CardContent>
      </Card>
    </div>
  );
}
