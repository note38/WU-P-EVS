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

  const handlePrint = () => {
    try {
      const exportData = prepareVoterDataForExport(voters);
      const result = printVoters(exportData, title);

      if (result.success) {
        toast({
          title: "Print Successful",
          description: "Print dialog opened successfully.",
        });
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
    }
  };

  const handleExportPDF = async () => {
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
    <div className="flex gap-2">
      {/* Print Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={disabled || voters.length === 0}
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

  const handlePrint = () => {
    try {
      const exportData = prepareVoterDataForExport(voters);
      printVoters(exportData, title);
      toast({
        title: "Print Successful",
        description: "Print dialog opened successfully.",
      });
    } catch (error) {
      toast({
        title: "Print Error",
        description: "An error occurred while preparing the print.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
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
          description: "Please install jspdf and jspdf-autotable packages.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "PDF Export Error",
        description: "Please install required dependencies.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
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
          description: "Please install xlsx and file-saver packages.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Excel Export Error",
        description: "Please install required dependencies.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || voters.length === 0 || isExporting}
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export & Print
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePrint}>
          <PrinterIcon className="mr-2 h-4 w-4" />
          Print Report
        </DropdownMenuItem>
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
  );
}
