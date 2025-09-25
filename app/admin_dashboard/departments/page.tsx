"use client";

import { DepartmentSettings } from "@/app/components/settings/department-form";
import { DepartmentsPageClient } from "./departments-page-client";

export default function DepartmentsPage() {
  return (
    <DepartmentsPageClient>
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage departments in the system.
          </p>
        </div>
        <DepartmentSettings />
      </div>
    </DepartmentsPageClient>
  );
}
