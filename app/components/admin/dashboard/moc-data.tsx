// File: src/components/Dashboard/mockData.ts
import { Vote, Users, Flag, Award } from "lucide-react";

export interface Candidate {
  name: string;
  votes: number;
  party: string;
}

export interface Position {
  title: string;
  candidates: Candidate[];
}

export interface Activity {
  id: number;
  action: string;
  user: string;
  time: string;
}

export interface Voter {
  id: number;
  name: string;
  time: string;
}

export interface StatsCard {
  title: string;
  value: string;
  description: string;
}

export const mockData = {
  positions: [
    {
      title: "President",
      candidates: [
        { name: "John Smith", votes: 1234, party: "Democratic Party" },
        { name: "Jane Doe", votes: 987, party: "Republican Party" },
        { name: "Bob Johnson", votes: 567, party: "Independent" },
      ],
    },
    {
      title: "Vice President",
      candidates: [
        { name: "Sarah Williams", votes: 1100, party: "Democratic Party" },
        { name: "Mike Brown", votes: 950, party: "Republican Party" },
        { name: "Lisa Garcia", votes: 600, party: "Independent" },
      ],
    },
    {
      title: "Secretary",
      candidates: [
        { name: "David Lee", votes: 890, party: "Democratic Party" },
        { name: "Emily Chen", votes: 920, party: "Republican Party" },
        { name: "Alex Kim", votes: 450, party: "Independent" },
      ],
    },
    {
      title: "Treasurer",
      candidates: [
        { name: "Maria Rodriguez", votes: 780, party: "Democratic Party" },
        { name: "James Wilson", votes: 810, party: "Republican Party" },
        { name: "Sophia Taylor", votes: 520, party: "Independent" },
      ],
    },
  ] as Position[],

  recentActivities: [
    { id: 1, action: "Vote Cast", user: "User #12345", time: "2 minutes ago" },
    {
      id: 2,
      action: "New Candidate Added",
      user: "Admin",
      time: "15 minutes ago",
    },
    { id: 3, action: "Election Started", user: "System", time: "1 hour ago" },
    { id: 4, action: "Vote Cast", user: "User #67890", time: "1 hour ago" },
    { id: 5, action: "Vote Cast", user: "User #54321", time: "2 hours ago" },
  ] as Activity[],

  recentVoters: [
    { id: 1, name: "User #12345", time: "2 minutes ago" },
    { id: 2, name: "User #67890", time: "1 hour ago" },
    { id: 3, name: "User #54321", time: "2 hours ago" },
    { id: 4, name: "User #98765", time: "3 hours ago" },
    { id: 5, name: "User #13579", time: "4 hours ago" },
  ] as Voter[],

  statsCards: [
    {
      title: "Total Elections",
      value: "3",
      description: "1 active, 2 completed",
    },
    {
      title: "Candidates",
      value: "12",
      description: "Across 4 positions",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Partylists",
      value: "3",
      description: "Democratic, Republican, Independent",
      icon: <Flag className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: "Voters",
      value: "5,432",
      description: "2,345 have voted",
      icon: <Award className="h-4 w-4 text-muted-foreground" />,
    },
  ] as StatsCard[],
};
