"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  EditIcon,
  TrashIcon,
  EyeIcon,
  PrinterIcon,
  SendIcon,
  MoreHorizontal,
  Users,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VoterCards from "./voter-card";

// Define VoterStatus enum since we don't have @prisma/client
enum VoterStatus {
  REGISTERED = "REGISTERED",
  VOTED = "VOTED",
}

type Voter = {
  id: number;
  voterId?: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  status: VoterStatus;
  avatar: string;
  credentialsSent: boolean;
  createdAt: Date;
  election: {
    name: string;
    id: number;
  };
  year: {
    name: string;
    id: number;
  };
  info?: any;
};

// Define Year type (renamed from Department)
type Year = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  voterCount: number;
};

interface DepartmentCardProps {
  voters: Voter[];
  info?: any | null;
}

export default function DepartmentCard({ voters, info }: DepartmentCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const getFullName = (voter: Voter) => {
    return `${voter.firstName} ${voter.middleName} ${voter.lastName}`
      .trim()
      .replace(/\s+/g, " ");
  };

  // Get unique year names
  const yearNames = Array.from(new Set(voters.map((voter) => voter.year.name)));

  // Create year objects with additional properties
  const years: Year[] = yearNames.map((name) => {
    const yearVoters = voters.filter((voter) => voter.year.name === name);
    return {
      id: name.toLowerCase().replace(/\s+/g, "-"), // Create ID from name
      name,
      description: `${name} year voters and information`,
      icon: <Users className="h-4 w-4 mr-1" />,
      color: getRandomColor(name), // Generate a consistent color based on name
      voterCount: yearVoters.length,
    };
  });

  // Generate a consistent color based on year name
  function getRandomColor(name: string): string {
    // Simple hash function to generate a consistent color
    const hash = name.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Map to badge variants
    const colors = [
      "bg-primary",
      "bg-secondary",
      "bg-accent",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
    ];
    return colors[Math.abs(hash) % colors.length];
  }

  const filteredVoters = voters.filter((voter) => {
    const fullName = getFullName(voter);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      fullName.toLowerCase().includes(searchLower) ||
      voter.email.toLowerCase().includes(searchLower) ||
      voter.voterId?.toLowerCase().includes(searchLower) ||
      false;

    const matchesYear =
      selectedYear === "all" ||
      voter.year.name ===
        yearNames.find(
          (name) => name.toLowerCase().replace(/\s+/g, "-") === selectedYear
        );

    return matchesSearch && matchesYear;
  });

  // Handle year selection
  const handleYearClick = (yearId: string) => {
    setSelectedYear(yearId);
  };

  const toggleVoterSelection = (voterId: number) => {
    setSelectedVoters((prev) =>
      prev.includes(voterId)
        ? prev.filter((id) => id !== voterId)
        : [...prev, voterId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedVoters(
      selectedVoters.length === filteredVoters.length
        ? []
        : filteredVoters.map((voter) => voter.id)
    );
  };

  const handleBulkEmail = () => {
    console.log("Sending emails to:", selectedVoters);
    // Implement actual email logic
  };

  // Group voters by year
  const votersByYear = years.reduce<Record<string, Voter[]>>((acc, year) => {
    acc[year.id] = voters.filter((voter) => voter.year.name === year.name);
    return acc;
  }, {});

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {years.map((year) => (
          <Card
            key={year.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedYear === year.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleYearClick(year.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center space-x-2">
                {year.icon}
                <CardTitle>{year.name}</CardTitle>
              </div>
              <Badge className="bg-green-300">{year.voterCount} voters</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">
                {year.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm text-muted-foreground">
                    View voters
                  </span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${selectedYear === year.id ? "rotate-90" : ""}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedYear && selectedYear !== "all" && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>
                Voters in {years.find((y) => y.id === selectedYear)?.name}
              </CardTitle>
              <CardDescription>Manage voters in this year</CardDescription>
            </CardHeader>
            <CardContent>
              <VoterCards voters={votersByYear[selectedYear] || []} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
