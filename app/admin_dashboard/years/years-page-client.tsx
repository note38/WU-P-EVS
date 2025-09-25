"use client";

import { ReactNode } from "react";

interface YearsPageClientProps {
  children: ReactNode;
}

export function YearsPageClient({ children }: YearsPageClientProps) {
  return <>{children}</>;
}
