"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder={placeholder}
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
