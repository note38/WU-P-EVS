"use client";

import { useMemo } from "react";

interface UserAvatarSvgProps {
  name?: string;
  size?: number;
  className?: string;
  hideName?: boolean;
}

/**
 * Consistent user avatar SVG component that provides the same avatar
 * across the application whether names are hidden or shown.
 */
export function UserAvatarSvg({
  name = "U",
  size = 64,
  className = "",
  hideName = false,
}: UserAvatarSvgProps) {
  // Generate consistent colors based on the name
  const colors = useMemo(() => {
    if (hideName) {
      // For anonymous users, use neutral colors
      return {
        background: "#e5e7eb", // gray-200
        text: "#6b7280",       // gray-500
      };
    }
    
    // Generate consistent colors based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Create a color palette based on the hash
    const backgroundColors = [
      "#fee2e2", // red-100
      "#ffedd5", // orange-100
      "#fef3c7", // amber-100
      "#fef9c3", // yellow-100
      "#dcfce7", // green-100
      "#cffafe", // cyan-100
      "#e0f2fe", // blue-100
      "#ede9fe", // indigo-100
      "#fce7f3", // pink-100
    ];
    
    const textColors = [
      "#b91c1c", // red-700
      "#c2410c", // orange-700
      "#b45309", // amber-700
      "#a16207", // yellow-700
      "#166534", // green-700
      "#0e7490", // cyan-700
      "#1e40af", // blue-700
      "#4338ca", // indigo-700
      "#be185d", // pink-700
    ];
    
    const index = Math.abs(hash) % backgroundColors.length;
    
    return {
      background: backgroundColors[index],
      text: textColors[index],
    };
  }, [name, hideName]);

  // Get initials from name
  const initials = useMemo(() => {
    if (hideName) {
      return "?";
    }
    
    const names = name.split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }, [name, hideName]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={size} height={size} rx={size / 2} fill={colors.background} />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size / 2.5}
        fontWeight="500"
        fill={colors.text}
        fontFamily="sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}