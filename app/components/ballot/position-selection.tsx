"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Position } from "@/types/ballot";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";

interface PositionSelectionProps {
  position: Position;
  selectedCandidate: string | string[];
  onSelect: (candidateId: string | string[]) => void;
}

export function PositionSelection({
  position,
  selectedCandidate,
  onSelect,
}: PositionSelectionProps) {
  const maxCandidates = position.maxCandidates || 1;
  const isMultiSelect = maxCandidates > 1;

  // Convert selectedCandidate prop to array for multi-select, or single string for single select
  const selectedArray: string[] = Array.isArray(selectedCandidate)
    ? selectedCandidate
    : selectedCandidate && selectedCandidate !== "skip"
      ? selectedCandidate.split(",")
      : [];

  const handleCardClick = (candidateId: string) => {
    if (!isMultiSelect) {
      onSelect(candidateId);
      return;
    }

    const isSelected = selectedArray.includes(candidateId);
    if (isSelected) {
      // Remove candidate
      const updated = selectedArray.filter((id) => id !== candidateId);
      onSelect(updated);
    } else {
      // Add candidate if limit not reached
      if (selectedArray.length >= maxCandidates) {
        toast({
          title: "Selection limit reached",
          description: `You can only select up to ${maxCandidates} candidate(s) for ${position.title}.`,
          variant: "destructive",
        });
        return;
      }
      const updated = [...selectedArray, candidateId];
      onSelect(updated);
    }
  };

  return (
    <div className="w-full space-y-3">
      {isMultiSelect && (
        <div className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded-md text-sm">
          <span className="text-muted-foreground">
            Select up to <strong className="text-foreground">{maxCandidates}</strong> candidates:
          </span>
          <Badge variant={selectedArray.length === maxCandidates ? "default" : "outline"}>
            {selectedArray.length} / {maxCandidates} selected
          </Badge>
        </div>
      )}

      {isMultiSelect ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[calc(100vh-400px)] overflow-y-auto p-1">
          {position.candidates.map((candidate) => {
            const isSelected = selectedArray.includes(candidate.id);
            return (
              <div
                key={candidate.id}
                className={`relative flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "hover:bg-muted"
                }`}
                onClick={() => handleCardClick(candidate.id)}
              >
                <div className="absolute top-3 right-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleCardClick(candidate.id)}
                  />
                </div>
                <div className="relative h-24 w-24 mb-3 overflow-hidden rounded-full border">
                  <Image
                    src={candidate.avatar || "/placeholder.svg"}
                    alt={candidate.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <Label
                  className="text-lg font-medium text-center cursor-pointer"
                >
                  {candidate.name}
                </Label>
                <p className="text-sm text-muted-foreground text-center">
                  {candidate.party}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <RadioGroup
          value={typeof selectedCandidate === "string" ? selectedCandidate : ""}
          onValueChange={onSelect}
          className="w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[calc(100vh-400px)] overflow-y-auto p-1">
            {position.candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedCandidate === candidate.id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelect(candidate.id)}
                onTouchStart={() => onSelect(candidate.id)}
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
      )}
    </div>
  );
}

