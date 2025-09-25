"use client";

import { ReactNode } from "react";

interface DepartmentsPageClientProps {
  children: ReactNode;
}

export function DepartmentsPageClient({
  children,
}: DepartmentsPageClientProps) {
  return <>{children}</>;
}
