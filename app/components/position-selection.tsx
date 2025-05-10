"use client";

import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Position } from "@/types/ballot";

interface PositionSelectionProps {
  position: Position;
  selectedCandidate: string;
  onSelect: (candidateId: string) => void;
}

export function PositionSelection({
  position,
  selectedCandidate,
  onSelect,
}: PositionSelectionProps) {
  return (
    <RadioGroup
      value={selectedCandidate}
      onValueChange={onSelect}
      className="w-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {position.candidates.map((candidate) => (
          <div
            key={candidate.id}
            className={`flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedCandidate === candidate.id
                ? "bg-primary/10 border-primary"
                : "hover:bg-muted"
            }`}
            onClick={() => onSelect(candidate.id)}
          >
            <RadioGroupItem
              value={candidate.id}
              id={`${position.id}-${candidate.id}`}
              className="sr-only"
            />
            <div className="relative h-24 w-24 mb-3 overflow-hidden rounded-full border">
              <Image
                src={candidate.avatar || "/placeholder.svg"}
                alt={candidate.name}
                fill
                className="object-cover"
              />
            </div>
            <Label
              htmlFor={`${position.id}-${candidate.id}`}
              className="text-lg font-medium text-center cursor-pointer"
            >
              {candidate.name}
            </Label>
            <p className="text-sm text-muted-foreground text-center">
              {candidate.party}
            </p>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}
