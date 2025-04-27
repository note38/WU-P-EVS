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
  DISQUALIFIED = "DISQUALIFIED",
}

type Voter = {
  id: number;
  voterId: string;
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
  };
  department: {
    name: string;
  };
  info?: any;
};

// Define Department type
type Department = {
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
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const getFullName = (voter: Voter) => {
    return `${voter.firstName} ${voter.middleName} ${voter.lastName}`
      .trim()
      .replace(/\s+/g, " ");
  };

  // Get unique department names
  const departmentNames = Array.from(
    new Set(voters.map((voter) => voter.department.name))
  );

  // Create department objects with additional properties
  const departments: Department[] = departmentNames.map((name) => {
    const departmentVoters = voters.filter(
      (voter) => voter.department.name === name
    );
    return {
      id: name.toLowerCase().replace(/\s+/g, "-"), // Create ID from name
      name,
      description: `${name} department voters and information`,
      icon: <Users className="h-4 w-4 mr-1" />,
      color: getRandomColor(name), // Generate a consistent color based on name
      voterCount: departmentVoters.length,
    };
  });

  // Generate a consistent color based on department name
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
      voter.voterId.toLowerCase().includes(searchLower);

    const matchesDepartment =
      selectedDepartment === "all" ||
      voter.department.name ===
        departmentNames.find(
          (name) =>
            name.toLowerCase().replace(/\s+/g, "-") === selectedDepartment
        );

    return matchesSearch && matchesDepartment;
  });

  // Handle department selection
  const handleDepartmentClick = (departmentId: string) => {
    setSelectedDepartment(departmentId);
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

  // Group voters by department
  const votersByDepartment = departments.reduce<Record<string, Voter[]>>(
    (acc, department) => {
      acc[department.id] = voters.filter(
        (voter) => voter.department.name === department.name
      );
      return acc;
    },
    {}
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department) => (
          <Card
            key={department.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedDepartment === department.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleDepartmentClick(department.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center space-x-2">
                {department.icon}
                <CardTitle>{department.name}</CardTitle>
              </div>
              <Badge className="bg-green-300">
                {department.voterCount} voters
              </Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">
                {department.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm text-muted-foreground">
                    View voters
                  </span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${selectedDepartment === department.id ? "rotate-90" : ""}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedDepartment && selectedDepartment !== "all" && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>
                Voters in{" "}
                {departments.find((d) => d.id === selectedDepartment)?.name}
              </CardTitle>
              <CardDescription>
                Manage voters in this department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VoterCards
                voters={votersByDepartment[selectedDepartment] || []}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
