"use client";

// app/components/admin/voter-detail/import-voters-excel-dialog.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  HelpCircle,
  Info,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";

interface ImportVotersExcelDialogProps {
  onImportSuccess?: () => void;
}

// Fetch structure types
interface Year {
  id: number;
  name: string;
  programId: number;
  program: {
    id: number;
    name: string;
    departmentId: number;
    department: {
      id: number;
      name: string;
    };
  };
}

interface Election {
  id: number;
  name: string;
  status: string;
}

interface ParsedVoter {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  yearId: number | null;
  resolvedProgramName?: string;
  resolvedYearName?: string;
  rowNumber: number;
  status: "valid" | "invalid" | "duplicate" | "unmapped_year";
  validationErrors: string[];
}

export function ImportVotersExcelDialog({
  onImportSuccess,
}: ImportVotersExcelDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // File states
  const [file, setFile] = useState<File | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [sheetRows, setSheetRows] = useState<Record<string, any>[]>([]);

  // Metadata from DB
  const [dbYears, setDbYears] = useState<Year[]>([]);
  const [elections, setElections] = useState<Election[]>([]);

  // Form Configurations
  const [selectedElectionId, setSelectedElectionId] = useState<string>("none");
  // Removed assignmentMode state and UI; rely on manual department/program/year selection

  // Selection states for Single Mode
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: number; name: string; departmentId: number }[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<{ id: number; name: string }[]>([]);
  const [filteredYears, setFilteredYears] = useState<{ id: number; name: string }[]>([]);
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedProgId, setSelectedProgId] = useState<string>("");
  const [selectedYearId, setSelectedYearId] = useState<string>("");

  // Column mapping states
  const [mappings, setMappings] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
  });

  // Final voters list to import
  const [processedVoters, setProcessedVoters] = useState<ParsedVoter[]>([]);
  const [importSummary, setImportSummary] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    imported: 0,
    skipped: 0,
    errors: [] as Array<{ email: string; name: string; error: string }>,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial setup data
  useEffect(() => {
    if (open) {
      fetchConfigData();
    } else {
      resetImporter();
    }
  }, [open]);

  // Handle department filter change for Programs
  useEffect(() => {
    if (selectedDeptId) {
      const deptId = parseInt(selectedDeptId);
      const filtered = programs.filter((p) => p.departmentId === deptId);
      setFilteredPrograms(filtered);
      setSelectedProgId("");
      setSelectedYearId("");
      setFilteredYears([]);
    } else {
      setFilteredPrograms([]);
      setSelectedProgId("");
      setSelectedYearId("");
      setFilteredYears([]);
    }
  }, [selectedDeptId, programs]);

  // Handle program filter change for Years
  useEffect(() => {
    if (selectedProgId) {
      const progId = parseInt(selectedProgId);
      const filtered = dbYears
        .filter((y) => y.programId === progId)
        .map((y) => ({ id: y.id, name: y.name }));
      setFilteredYears(filtered);
      setSelectedYearId("");
    } else {
      setFilteredYears([]);
      setSelectedYearId("");
    }
  }, [selectedProgId, dbYears]);

  const resetImporter = () => {
    setStep(1);
    setFile(null);
    setSheetHeaders([]);
    setSheetRows([]);
    setSelectedElectionId("none");
    setSelectedDeptId("");
    setSelectedProgId("");
    setSelectedYearId("");
    setMappings({
      // Removed programColumn and yearColumn from mappings as they are no longer used
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
    });
    setProcessedVoters([]);
    setIsSubmitting(false);
  };

  const fetchConfigData = async () => {
    setLoadingConfig(true);
    try {
      const [yearsRes, electionsRes, departmentsRes, programsRes] = await Promise.all([
        fetch("/api/years"),
        fetch("/api/elections"),
        fetch("/api/departments"),
        fetch("/api/programs"),
      ]);

      if (yearsRes.ok && electionsRes.ok && departmentsRes.ok && programsRes.ok) {
        const yearsData: Year[] = await yearsRes.json();
        const electionsData: Election[] = await electionsRes.json();
        const departmentsData: { id: number; name: string }[] = await departmentsRes.json();
        const programsData: { id: number; name: string; departmentId: number }[] = await programsRes.json();

        setDbYears(yearsData);

        // Filter active elections
        const activeElections = electionsData.filter((e) => e.status === "ACTIVE");
        setElections(activeElections);

        setDepartments(departmentsData);
        setPrograms(programsData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load database structure",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading config:", error);
      toast({
        title: "Error",
        description: "Failed to load database structure due to a network error",
        variant: "destructive",
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  // Parse Excel file client-side
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Get 2D Sheet representation to extract headers
        const rawSheetData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
          header: 1,
        });

        if (rawSheetData.length === 0) {
          toast({
            title: "Empty File",
            description: "No rows detected in this sheet",
            variant: "destructive",
          });
          return;
        }

        const headers = (rawSheetData[0] || []).map((h) => String(h).trim());
        setSheetHeaders(headers);

        // Get full object records
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
        setSheetRows(rows);

        // Auto-detect columns
        const newMappings = {
          firstName: "",
          lastName: "",
          middleName: "",
          email: "",
        };

        headers.forEach((h) => {
          const lower = h.toLowerCase();
          if (
            lower.includes("first name") ||
            lower.includes("given name") ||
            (lower.includes("name") && !lower.includes("last") && !lower.includes("middle"))
          ) {
            newMappings.firstName = h;
          } else if (
            lower.includes("last name") ||
            lower.includes("family name") ||
            lower.includes("surname")
          ) {
            newMappings.lastName = h;
          } else if (lower.includes("middle name") || lower.includes("middlename")) {
            newMappings.middleName = h;
          } else if (lower.includes("email")) {
            newMappings.email = h;
          }
        });

        setMappings(newMappings);
        setStep(2);
      } catch (err) {
        console.error("Excel parse error:", err);
        toast({
          title: "Invalid File",
          description: "Could not read this Excel file. Ensure it is a valid .xlsx or .csv",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Helper matching functions for Dynamic Column mode
  const parseYearLevel = (text: string): number | null => {
    if (!text) return null;
    const normalized = text.toLowerCase().trim();
    if (
      normalized.includes("first") ||
      normalized.includes("1st") ||
      normalized === "1" ||
      normalized.includes("1 yr")
    ) {
      return 1;
    }
    if (
      normalized.includes("second") ||
      normalized.includes("2nd") ||
      normalized === "2" ||
      normalized.includes("2 yr")
    ) {
      return 2;
    }
    if (
      normalized.includes("third") ||
      normalized.includes("3rd") ||
      normalized === "3" ||
      normalized.includes("3 yr")
    ) {
      return 3;
    }
    if (
      normalized.includes("fourth") ||
      normalized.includes("4th") ||
      normalized === "4" ||
      normalized.includes("4 yr")
    ) {
      return 4;
    }
    return null;
  };

  const matchProgram = (dbProgName: string, text: string): boolean => {
    if (!text) return false;
    const dbNorm = dbProgName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const inputNorm = text.toLowerCase().replace(/[^a-z0-9]/g, "");

    return (
      dbNorm === inputNorm ||
      dbNorm.includes(inputNorm) ||
      inputNorm.includes(dbNorm)
    );
  };

  const matchYear = (dbYearName: string, text: string): boolean => {
    const dbLevel = parseYearLevel(dbYearName);
    const inputLevel = parseYearLevel(text);

    if (dbLevel !== null && inputLevel !== null) {
      return dbLevel === inputLevel;
    }

    // Fallback exact text contains
    return (
      dbYearName.toLowerCase().includes(text.toLowerCase()) ||
      text.toLowerCase().includes(dbYearName.toLowerCase())
    );
  };

  const handleNextToPreview = () => {
    // Validate mappings
    if (!mappings.firstName || !mappings.lastName || !mappings.email) {
      toast({
        title: "Required Mappings",
        description: "Please map at least First Name, Last Name, and Email columns.",
        variant: "destructive",
      });
      return;
    }

    // Process rows
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const voters: ParsedVoter[] = sheetRows.map((row, idx) => {
      const rowNum = idx + 2; // Excel is 1-indexed, header is row 1
      const firstName = String(row[mappings.firstName] || "").trim();
      const lastName = String(row[mappings.lastName] || "").trim();
      const middleName = mappings.middleName ? String(row[mappings.middleName] || "").trim() : "";
      const email = String(row[mappings.email] || "").trim();

      const validationErrors: string[] = [];

      if (!firstName) validationErrors.push("First name is missing");
      if (!lastName) validationErrors.push("Last name is missing");
      if (!email) {
        validationErrors.push("Email is missing");
      } else if (!emailRegex.test(email)) {
        validationErrors.push(`Invalid email format: "${email}"`);
      }

      let yearId: number | null = null;
      let resolvedProg: string | undefined = undefined;
      let resolvedYr: string | undefined = undefined;

      if (selectedYearId) {
        yearId = parseInt(selectedYearId);
        const y = dbYears.find((yr) => yr.id === yearId);
        resolvedProg = y?.program?.name;
        resolvedYr = y?.name;
      } else {
        validationErrors.push("Please select a Year.");
      }

      const status = validationErrors.length > 0 ? "invalid" : "valid";

      return {
        firstName,
        lastName,
        middleName,
        email,
        yearId,
        resolvedProgramName: resolvedProg,
        resolvedYearName: resolvedYr,
        rowNumber: rowNum,
        status: status as any,
        validationErrors,
      };
    });

    setProcessedVoters(voters);

    const total = voters.length;
    const valid = voters.filter((v) => v.status === "valid").length;
    const invalid = total - valid;

    setImportSummary((prev) => ({
      ...prev,
      total,
      valid,
      invalid,
    }));

    setStep(3);
  };

  const handleManualYearOverride = (rowIdx: number, yrIdStr: string) => {
    const yrId = parseInt(yrIdStr);
    const y = dbYears.find((yr) => yr.id === yrId);

    setProcessedVoters((prev) => {
      const copy = [...prev];
      const voter = { ...copy[rowIdx] };
      voter.yearId = yrId;
      voter.resolvedProgramName = y?.program?.name;
      voter.resolvedYearName = y?.name;

      // Filter out Year mapping validation errors
      voter.validationErrors = voter.validationErrors.filter(
        (err) => !err.includes("Please select a Year")
      );

      // Check if completely valid now
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isFieldsValid = voter.firstName && voter.lastName && voter.email && emailRegex.test(voter.email);
      
      voter.status = isFieldsValid ? "valid" : "invalid";
      copy[rowIdx] = voter;
      return copy;
    });

    // Update summary counts
    setTimeout(() => {
      setProcessedVoters((curr) => {
        const total = curr.length;
        const valid = curr.filter((v) => v.status === "valid").length;
        const invalid = total - valid;
        setImportSummary((prev) => ({
          ...prev,
          total,
          valid,
          invalid,
        }));
        return curr;
      });
    }, 50);
  };

  const handleImport = async () => {
    const validVoters = processedVoters.filter((v) => v.status === "valid");

    if (validVoters.length === 0) {
      toast({
        title: "No Valid Voters",
        description: "There are no valid voters to import. Fix issues or use override first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = validVoters.map((v) => ({
        firstName: v.firstName,
        lastName: v.lastName,
        middleName: v.middleName || null,
        email: v.email,
        yearId: v.yearId,
        electionId: selectedElectionId !== "none" ? parseInt(selectedElectionId) : null,
      }));

      const res = await fetch("/api/voters/import-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voters: submissionData,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setImportSummary((prev) => ({
          ...prev,
          imported: result.importedCount,
          skipped: result.skippedCount,
          errors: result.errors || [],
        }));
        setStep(4);

        toast({
          title: "Import Finished",
          description: `Successfully imported ${result.importedCount} voters.`,
        });

        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "An error occurred during import",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Network Error",
        description: "Failed to upload voters due to a connection issue.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Import from Excel/GForm
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="h-6 w-6 text-green-600 animate-pulse" />
            Voters Importer Wizard
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Import voters easily from Google Forms, Excel sheets, or CSV spreadsheets.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between w-full py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center font-semibold text-xs transition-colors duration-300 ${
                step >= 1 ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground">Upload File</span>
          </div>
          <div className="flex-1 h-0.5 mx-2 bg-muted">
            <div
              className="h-full bg-green-600 transition-all duration-500"
              style={{ width: step > 1 ? "100%" : "0%" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center font-semibold text-xs transition-colors duration-300 ${
                step >= 2 ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground">Map Schema</span>
          </div>
          <div className="flex-1 h-0.5 mx-2 bg-muted">
            <div
              className="h-full bg-green-600 transition-all duration-500"
              style={{ width: step > 2 ? "100%" : "0%" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center font-semibold text-xs transition-colors duration-300 ${
                step >= 3 ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground">Verify Data</span>
          </div>
          <div className="flex-1 h-0.5 mx-2 bg-muted">
            <div
              className="h-full bg-green-600 transition-all duration-500"
              style={{ width: step > 3 ? "100%" : "0%" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center font-semibold text-xs transition-colors duration-300 ${
                step >= 4 ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              4
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground">Results</span>
          </div>
        </div>

        {/* Content according to Steps */}
        <div className="flex-1 py-4 min-h-[300px]">
          {/* STEP 1: UPLOAD FILE */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-green-500 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-muted/20 hover:bg-green-500/5 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <Upload className="h-12 w-12 text-muted-foreground group-hover:text-green-600 mb-4 transition-transform duration-300 group-hover:-translate-y-1" />
                <h3 className="font-semibold text-lg text-foreground">
                  Select your Voter Spreadsheet
                </h3>
                <p className="text-sm text-muted-foreground text-center mt-2 max-w-sm">
                  Drag and drop your file here, or click to browse. Supports Excel (.xlsx, .xls) and CSV (.csv) sheets generated by Google Forms.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 flex gap-3 text-blue-800 dark:text-blue-300">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Format Guide:</p>
                  <p className="mt-1">
                    Your spreadsheet should ideally have columns for **First Name**, **Last Name**, and **Email Address**.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MAP COLUMNS */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column Mappings */}
                <div className="space-y-4 border border-border p-4 rounded-xl bg-card text-card-foreground shadow-sm">
                  <h3 className="font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Map Sheet Columns
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <Label className="flex items-center gap-1 text-foreground">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={mappings.firstName}
                        onValueChange={(val) =>
                          setMappings((prev) => ({ ...prev, firstName: val }))
                        }
                      >
                        <SelectTrigger className="border-input bg-background text-foreground">
                          <SelectValue placeholder="Choose column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sheetHeaders.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1 text-foreground">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={mappings.lastName}
                        onValueChange={(val) =>
                          setMappings((prev) => ({ ...prev, lastName: val }))
                        }
                      >
                        <SelectTrigger className="border-input bg-background text-foreground">
                          <SelectValue placeholder="Choose column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sheetHeaders.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-foreground">Middle Name (Optional)</Label>
                      <Select
                        value={mappings.middleName}
                        onValueChange={(val) =>
                          setMappings((prev) => ({ ...prev, middleName: val }))
                        }
                      >
                        <SelectTrigger className="border-input bg-background text-foreground">
                          <SelectValue placeholder="Select column (none/skip)..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none_middle_skip">Skip / Do Not Map</SelectItem>
                          {sheetHeaders.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1 text-foreground">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={mappings.email}
                        onValueChange={(val) =>
                          setMappings((prev) => ({ ...prev, email: val }))
                        }
                      >
                        <SelectTrigger className="border-input bg-background text-foreground">
                          <SelectValue placeholder="Choose column..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sheetHeaders.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Assignment Settings */}
                <div className="space-y-4 border border-border p-4 rounded-xl bg-card text-card-foreground shadow-sm flex flex-col">
                  <h3 className="font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                    <Info className="h-5 w-5 text-green-600" />
                    Importer Options
                  </h3>

                  <div className="space-y-4 flex-1">
                    {/* Active Election Association */}
                    <div>
                      <Label className="text-foreground">Link to Active Election (Optional)</Label>
                      <Select
                        value={selectedElectionId}
                        onValueChange={setSelectedElectionId}
                      >
                        <SelectTrigger className="border-input bg-background text-foreground">
                          <SelectValue placeholder="Select election..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Active Election</SelectItem>
                          {elections.map((elec) => (
                            <SelectItem key={elec.id} value={elec.id.toString()}>
                              {elec.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Voters will be automatically added as authorized voters to this election.
                      </p>
                    </div>

                    {/* Department, Program, and Year mapping */}
                    <div className="space-y-2 border-t border-border pt-3">
                      <Label className="font-semibold text-sm text-foreground">Assign Department, Program & Year</Label>
                      <div className="space-y-3 pt-3">
                        <div>
                          <Label className="text-foreground">Department</Label>
                          <Select
                            value={selectedDeptId}
                            onValueChange={setSelectedDeptId}
                          >
                            <SelectTrigger className="border-input bg-background text-foreground">
                              <SelectValue placeholder="Select department..." />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id.toString()}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-foreground">Program</Label>
                          <Select
                            value={selectedProgId}
                            onValueChange={setSelectedProgId}
                            disabled={!selectedDeptId}
                          >
                            <SelectTrigger className="border-input bg-background text-foreground">
                              <SelectValue placeholder="Select program..." />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredPrograms.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-foreground">Year Level</Label>
                          <Select
                            value={selectedYearId}
                            onValueChange={setSelectedYearId}
                            disabled={!selectedProgId}
                          >
                            <SelectTrigger className="border-input bg-background text-foreground">
                              <SelectValue placeholder="Select year..." />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredYears.map((y) => (
                                <SelectItem key={y.id} value={y.id.toString()}>
                                  {y.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleNextToPreview}
                  disabled={
                    !mappings.firstName || !mappings.lastName || !mappings.email
                  }
                >
                  Parse and Preview Data
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW AND VALIDATE */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary Dashboard */}
              <div className="grid grid-cols-3 gap-4 border border-border p-4 rounded-xl bg-muted/30">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Total Rows</p>
                  <p className="text-2xl font-bold text-foreground">{importSummary.total}</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Valid & Ready</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{importSummary.valid}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">With Errors</p>
                  <p className="text-2xl font-bold text-red-500 dark:text-red-400">{importSummary.invalid}</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-card text-card-foreground max-h-[350px] overflow-y-auto shadow-sm">
                <table className="w-full text-sm border-collapse text-left">
                  <thead className="bg-muted sticky top-0 border-b border-border font-medium text-foreground">
                    <tr>
                      <th className="p-3 w-12 text-center">Row</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Resolved Year/Program</th>
                      <th className="p-3 w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-muted-foreground">
                    {processedVoters.map((v, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-muted/40 transition-colors ${
                          v.status === "invalid" ? "bg-red-500/5" : ""
                        }`}
                      >
                        <td className="p-3 text-center text-xs font-semibold text-muted-foreground/60">
                          {v.rowNumber}
                        </td>
                        <td className="p-3 font-semibold text-foreground">
                          {v.lastName}, {v.firstName}{" "}
                          {v.middleName ? `${v.middleName.charAt(0)}.` : ""}
                        </td>
                        <td className="p-3 font-mono text-xs">{v.email}</td>
                        <td className="p-3">
                          {v.yearId ? (
                            <span className="text-xs text-muted-foreground">
                              {v.resolvedProgramName} - {v.resolvedYearName}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Select
                                onValueChange={(val) =>
                                  handleManualYearOverride(idx, val)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs max-w-[200px] border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                                  <SelectValue placeholder="Map Year manually..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {dbYears.map((yr) => (
                                    <SelectItem key={yr.id} value={yr.id.toString()}>
                                      {yr.program?.name} - {yr.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {v.status === "valid" ? (
                            <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-medium border border-green-500/20">
                              <CheckCircle className="h-3 w-3" />
                              Valid
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-medium border border-red-500/20 w-max">
                                <AlertCircle className="h-3 w-3" />
                                Error
                              </span>
                              <span className="text-[10px] text-red-500 dark:text-red-400 font-medium leading-tight max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                                {v.validationErrors[0]}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions */}
              <div className="text-xs text-muted-foreground flex gap-2">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <p>
                  Rows with **Errors** will be skipped during import. For rows with Program/Year matching errors, you can use the dropdown to override and select a department year manually.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isSubmitting || importSummary.valid === 0}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing {importSummary.valid} Voters...
                    </>
                  ) : (
                    `Import ${importSummary.valid} Voters`
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT RESULTS */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center justify-center p-6 border border-border rounded-xl bg-green-500/10 dark:bg-green-950/20 max-w-md mx-auto shadow-sm">
                <CheckCircle className="h-16 w-16 text-green-600 mb-4 animate-bounce" />
                <h3 className="text-2xl font-bold text-foreground">Import Complete!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  The spreadsheet has been processed. Here is the final summary:
                </p>

                <div className="grid grid-cols-2 gap-4 w-full mt-6 bg-card border border-border p-4 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Created Voters</p>
                    <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1">
                      {importSummary.imported}
                    </p>
                  </div>
                  <div className="border-l border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Skipped / Duplicates</p>
                    <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                      {importSummary.skipped}
                    </p>
                  </div>
                </div>
              </div>

              {/* Show errors/skipped rows if they exist */}
              {importSummary.errors.length > 0 && (
                <div className="space-y-3 text-left">
                  <h4 className="font-bold text-foreground flex items-center gap-2 text-sm uppercase tracking-wide">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Details of Skipped Rows ({importSummary.errors.length})
                  </h4>

                  <div className="border border-border rounded-xl overflow-hidden bg-card text-card-foreground max-h-[220px] overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted border-b border-border font-medium text-muted-foreground sticky top-0">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Reason / Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-muted-foreground">
                        {importSummary.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-amber-500/5">
                            <td className="p-2 font-semibold text-foreground">{err.name}</td>
                            <td className="p-2 font-mono text-muted-foreground">{err.email}</td>
                            <td className="p-2 text-red-500 dark:text-red-400 font-medium">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4 border-t border-border">
                <Button onClick={() => setOpen(false)} className="px-8">
                  Close Importer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
