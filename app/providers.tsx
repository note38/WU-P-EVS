"use client";

import { SessionProvider } from "next-auth/react";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // Refetch session every hour
      refetchInterval={60 * 60}
      // Re-fetch session when window is focused
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
