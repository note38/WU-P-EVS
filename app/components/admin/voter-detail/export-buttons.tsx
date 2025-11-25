"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PrinterIcon,
  DownloadIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { VoterData } from "@/lib/data/VoterDataService";
import {
  prepareVoterDataForExport,
  printVoters,
  exportToPDF,
  exportToExcel,
  ExportVoter,
  EnhancedVoterData,
  PrintResult,
} from "@/lib/export-utils";

interface ExportButtonsProps {
  voters: EnhancedVoterData[] | VoterData[] | any[];
  title?: string;
  disabled?: boolean;
}

export function ExportButtons({
  voters,
  title = "All Voters Report",
  disabled = false,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = async () => {
    try {
      const exportData = prepareVoterDataForExport(voters);
      const result: PrintResult = await printVoters(exportData, title);

      if (result.success) {
        toast({
          title: "Print Successful",
          description: "Print dialog opened successfully.",
        });
      } else if (result.cancelled) {
        // When user cancels print dialog, refresh the page
        toast({
          title: "Print Cancelled",
          description: "Refreshing page...",
        });
        // Small delay to show the toast before refreshing
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Print Failed",
          description: result.error || "Failed to open print dialog.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Print Error",
        description: "An error occurred while preparing the print.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (voters.length === 0) {
      toast({
        title: "No Data",
        description: "No voters to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = prepareVoterDataForExport(voters);
      const result = await exportToPDF(exportData, title);

      if (result.success) {
        toast({
          title: "PDF Export Successful",
          description: `File saved as: ${result.fileName}`,
        });
      } else {
        toast({
          title: "PDF Export Failed",
          description:
            result.error ||
            "Failed to export PDF. Please install required dependencies.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "PDF Export Error",
        description:
          "Please install jspdf and jspdf-autotable packages to use PDF export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (voters.length === 0) {
      toast({
        title: "No Data",
        description: "No voters to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = prepareVoterDataForExport(voters);
      const result = await exportToExcel(exportData, title);

      if (result.success) {
        toast({
          title: "Excel Export Successful",
          description: `File saved as: ${result.fileName}`,
        });
      } else {
        toast({
          title: "Excel Export Failed",
          description:
            result.error ||
            "Failed to export Excel. Please install required dependencies.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Excel Export Error",
        description:
          "Please install xlsx and file-saver packages to use Excel export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Print Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={disabled || voters.length === 0}
        className="w-full sm:w-auto"
      >
        <PrinterIcon className="mr-2 h-4 w-4" />
        Print
      </Button>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || voters.length === 0 || isExporting}
            className="w-full sm:w-auto"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
            <FileTextIcon className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
            <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactExportButtons({
  voters,
  title = "Voters Report",
  disabled = false,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = async () => {
    try {
      const exportData = prepareVoterDataForExport(voters);
      const result: PrintResult = await printVoters(exportData, title);

      if (result.success) {
        toast({
          title: "Print Successful",
          description: "Print dialog opened successfully.",
        });
      } else if (result.cancelled) {
        // When user cancels print dialog, refresh the page
        toast({
          title: "Print Cancelled",
          description: "Refreshing page...",
        });
        // Small delay to show the toast before refreshing
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Print Failed",
          description: result.error || "Failed to open print dialog.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Print Error",
        description: "An error occurred while preparing the print.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (voters.length === 0) {
      toast({
        title: "No Data",
        description: "No voters to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = prepareVoterDataForExport(voters);
      const result = await exportToPDF(exportData, title);

      if (result.success) {
        toast({
          title: "PDF Export Successful",
          description: `File saved as: ${result.fileName}`,
        });
      } else {
        toast({
          title: "PDF Export Failed",
          description:
            result.error ||
            "Failed to export PDF. Please install required dependencies.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "PDF Export Error",
        description:
          "Please install jspdf and jspdf-autotable packages to use PDF export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (voters.length === 0) {
      toast({
        title: "No Data",
        description: "No voters to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = prepareVoterDataForExport(voters);
      const result = await exportToExcel(exportData, title);

      if (result.success) {
        toast({
          title: "Excel Export Successful",
          description: `File saved as: ${result.fileName}`,
        });
      } else {
        toast({
          title: "Excel Export Failed",
          description:
            result.error ||
            "Failed to export Excel. Please install required dependencies.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Excel Export Error",
        description:
          "Please install xlsx and file-saver packages to use Excel export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Print Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={disabled || voters.length === 0}
        className="w-full sm:w-auto"
      >
        <PrinterIcon className="mr-2 h-4 w-4" />
        Print
      </Button>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || voters.length === 0 || isExporting}
            className="w-full sm:w-auto"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
            <FileTextIcon className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
            <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
