"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface OptimizedAvatarProps {
  src: string | null;
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}

const SIZES = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-40 w-40",
};

export function OptimizedAvatar({
  src,
  alt,
  className = "",
  size = "md",
  priority = false,
}: OptimizedAvatarProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const sizeClass = SIZES[size];

  // Reset states when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <Avatar
      className={`${sizeClass} ${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
    >
      {src && !error ? (
        <AvatarImage
          src={src}
          alt={alt}
          className="object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          sizes={size === "lg" ? "160px" : size === "md" ? "64px" : "40px"}
          decoding={priority ? "sync" : "async"}
          style={{ contentVisibility: "auto" }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      ) : null}
      <AvatarFallback>
        <User
          className={
            size === "lg" ? "h-20 w-20" : size === "md" ? "h-8 w-8" : "h-5 w-5"
          }
        />
      </AvatarFallback>
    </Avatar>
  );
}
