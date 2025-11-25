"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatarSvg } from "@/app/components/ui/user-avatar-svg";

interface Developer {
  id: number;
  name: string;
  title: string;
  avatar?: string;
}

const developers: Developer[] = [
  {
    id: 1,
    name: "Chardie Gotis",
    title: "Developer",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
  },
  {
    id: 2,
    name: "Hanes Talania",
    title: "Developer",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sam",
  },
  {
    id: 3,
    name: "Lloyd Ramos",
    title: "Developer",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor",
  },
  {
    id: 4,
    name: "Charvin Austria",
    title: "Developer",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan",
  },
];

interface DevelopersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DevelopersDialog({
  open,
  onOpenChange,
}: DevelopersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">Meet Our Developers</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {developers.map((developer) => (
            <div
              key={developer.id}
              className="flex flex-col items-center rounded-lg border p-4 text-center hover:bg-accent transition-colors"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full border mb-3">
                {developer.avatar ? (
                  <Avatar className="h-full w-full">
                    <AvatarImage src={developer.avatar} alt={developer.name} />
                    <AvatarFallback>
                      <UserAvatarSvg name={developer.name} size={64} />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <UserAvatarSvg name={developer.name} size={64} />
                )}
              </div>
              <h3 className="font-semibold">{developer.name}</h3>
              <p className="text-sm text-muted-foreground">{developer.title}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
