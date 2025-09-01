"use client";

import { ThemeProvider } from "@/app/components/theme-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="wup-evs-theme"
    >
      {children}
    </ThemeProvider>
  );
}
