"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Position } from "@/types/ballot";
import Image from "next/image";

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
            <div className="relative h-20 w-20 mb-2 overflow-hidden rounded-full border sm:h-24 sm:w-24">
              <Image
                src={candidate.avatar || "/placeholder.svg"}
                alt={candidate.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, 96px"
              />
            </div>
            <Label
              htmlFor={`${position.id}-${candidate.id}`}
              className="text-base font-medium text-center cursor-pointer sm:text-lg"
            >
              {candidate.name}
            </Label>
            <p className="text-xs text-muted-foreground text-center sm:text-sm">
              {candidate.party}
            </p>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}
