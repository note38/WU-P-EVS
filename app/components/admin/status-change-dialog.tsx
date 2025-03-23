"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StatusChangeDialogProps {
  electionName: string;
  action: "start" | "pause";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function StatusChangeDialog({
  electionName,
  action,
  open,
  onOpenChange,
  onConfirm,
}: StatusChangeDialogProps) {
  const title = action === "start" ? "Start Election" : "Pause Election";
  const description =
    action === "start"
      ? `Are you sure you want to start the election "${electionName}"? This will allow voters to cast their votes.`
      : `Are you sure you want to pause the election "${electionName}"? This will temporarily prevent voters from casting votes.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className={
              action === "start"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-amber-500 hover:bg-amber-600"
            }
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {action === "start" ? "Start Election" : "Pause Election"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
