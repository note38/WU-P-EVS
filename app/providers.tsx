"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/app/components/theme-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // Reduce refetch frequency for better performance
      refetchInterval={5 * 60} // 5 minutes instead of 1 hour
      // Only refetch when window is focused
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="wup-evs-theme"
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
