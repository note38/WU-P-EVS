"use client";

import { YearSettings } from "@/app/components/settings/year-form";
import { YearsPageClient } from "./years-page-client";

export default function YearsPage() {
  return (
    <YearsPageClient>
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Academic Years</h1>
          <p className="text-muted-foreground">
            Manage academic years in the system.
          </p>
        </div>
        <YearSettings />
      </div>
    </YearsPageClient>
  );
}
