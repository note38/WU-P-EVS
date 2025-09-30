import { VoterData } from "@/lib/data/VoterDataService";

// Types for export functionality
export interface ExportVoter {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: Date | string;
  year?: {
    id: number;
    name: string;
    departmentName?: string;
    departmentId?: number;
    department?: {
      id: number;
      name: string;
      image: string | null;
    };
  };
  election?: {
    id: number;
    name: string;
  } | null;
}

// Type for print result
export interface PrintResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

// Enhanced voter type that includes department information
export interface EnhancedVoterData extends Omit<VoterData, "year"> {
  year: {
    id: number;
    name: string;
    departmentName?: string;
    departmentId?: number;
    departmentImage?: string | null;
    // Keep compatibility with VoterData by including the department structure
    department?: {
      id: number;
      name: string;
      image: string | null;
    };
  } | null;
}

// Convert VoterData to ExportVoter format
export function prepareVoterDataForExport(
  voters: (VoterData | EnhancedVoterData)[]
): ExportVoter[] {
  return voters.map((voter) => {
    // Check if this is enhanced voter data with department info
    const isEnhanced = voter.year && "departmentName" in voter.year;

    let yearName: string;
    let departmentName: string;

    if (isEnhanced && (voter.year as any).departmentName) {
      // Use the department info that's already available
      departmentName = (voter.year as any).departmentName;
      // Extract year name from the full name (e.g., "Year 1 - Computer Science" -> "Year 1")
      const yearParts = voter.year?.name ? voter.year.name.split(" - ") : [];
      yearName = yearParts[0] || voter.year?.name || "Unknown";
    } else {
      // Try to get department from the nested department object first
      if (voter.year && "department" in voter.year && voter.year.department) {
        departmentName = voter.year.department.name;
        yearName = voter.year?.name || "Unknown";
      } else {
        // Fallback to parsing from year name
        const yearParts = voter.year?.name ? voter.year.name.split(" - ") : [];
        yearName = yearParts[0] || "Unknown";
        departmentName = yearParts[1] || "Not assigned";
      }
    }

    return {
      id: voter.id,
      firstName: voter.firstName,
      middleName: voter.middleName,
      lastName: voter.lastName,
      email: voter.email,
      status: voter.status,
      createdAt: voter.createdAt,
      year: voter.year
        ? {
            ...voter.year,
            name: yearName,
            departmentName: departmentName,
          }
        : undefined,
      election: voter.election,
    };
  });
}

// PDF Export Function
export async function exportToPDF(
  voters: ExportVoter[],
  title: string = "Voters Report"
) {
  try {
    // Dynamic import to avoid SSR issues
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text(title, 14, 22);

    // Add metadata
    doc.setFontSize(12);
    doc.text(`Total Voters: ${voters.length}`, 14, 35);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      14,
      45
    );

    // Prepare table data
    const tableData = voters.map((voter) => [
      voter.id.toString(),
      `${voter.firstName} ${voter.middleName ? voter.middleName + " " : ""}${voter.lastName}`.trim(),
      voter.email,
      voter.year?.name || "Unknown",
      voter.year?.departmentName ||
        voter.year?.department?.name ||
        "Not assigned",
      voter.status.toLowerCase(),
      voter.election?.name || "Not assigned",
      new Date(voter.createdAt).toLocaleDateString(),
    ]);

    // Add table
    autoTable(doc, {
      head: [
        [
          "ID",
          "Name",
          "Email",
          "Year",
          "Department",
          "Status",
          "Election",
          "Created",
        ],
      ],
      body: tableData,
      startY: 55,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 15 }, // ID
        1: { cellWidth: 35 }, // Name
        2: { cellWidth: 40 }, // Email
        3: { cellWidth: 25 }, // Year
        4: { cellWidth: 30 }, // Department
        5: { cellWidth: 20 }, // Status
        6: { cellWidth: 30 }, // Election
        7: { cellWidth: 25 }, // Created
      },
    });

    // Save the PDF
    const fileName = `${title.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Excel Export Function
export async function exportToExcel(
  voters: ExportVoter[],
  title: string = "Voters Report"
) {
  try {
    // Dynamic import to avoid SSR issues
    const [XLSX, { default: saveAs }] = await Promise.all([
      import("xlsx"),
      import("file-saver"),
    ]);

    // Prepare data for Excel
    const excelData = voters.map((voter) => ({
      ID: voter.id,
      "First Name": voter.firstName,
      "Middle Name": voter.middleName || "",
      "Last Name": voter.lastName,
      "Full Name":
        `${voter.firstName} ${voter.middleName ? voter.middleName + " " : ""}${voter.lastName}`.trim(),
      Email: voter.email,
      Year: voter.year?.name || "Unknown",
      Department:
        voter.year?.departmentName ||
        voter.year?.department?.name ||
        "Not assigned",
      Status: voter.status,
      Election: voter.election?.name || "Not assigned",
      "Created Date": new Date(voter.createdAt).toLocaleDateString(),
      "Created Time": new Date(voter.createdAt).toLocaleTimeString(),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 8 }, // ID
      { wch: 15 }, // First Name
      { wch: 15 }, // Middle Name
      { wch: 15 }, // Last Name
      { wch: 30 }, // Full Name
      { wch: 30 }, // Email
      { wch: 20 }, // Year
      { wch: 25 }, // Department
      { wch: 12 }, // Status
      { wch: 25 }, // Election
      { wch: 15 }, // Created Date
      { wch: 15 }, // Created Time
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Voters");

    // Add metadata sheet
    const metadataSheet = XLSX.utils.json_to_sheet([
      { Property: "Report Title", Value: title },
      { Property: "Total Voters", Value: voters.length },
      { Property: "Generated Date", Value: new Date().toLocaleDateString() },
      { Property: "Generated Time", Value: new Date().toLocaleTimeString() },
      { Property: "Generated By", Value: "Voting System Admin" },
    ]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Report Info");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Save file
    const fileName = `${title.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.xlsx`;
    saveAs(blob, fileName);

    return { success: true, fileName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error exporting to Excel:", error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Print function (enhanced version)
export async function printVoters(
  voters: ExportVoter[],
  title: string = "Voters Report"
): Promise<PrintResult> {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return { success: false, error: "Could not open print window" };
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
          }
          .election-header {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 24px;
            background-color: #ffffff;
            border-bottom: 1px solid #dee2e6;
            text-align: center;
          }
          .branding {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 16px;
          }
          .logo {
            width: 60px;
            height: 60px;
          }
          .university-info {
            text-align: left;
          }
          .university-name {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: #212529;
          }
          .system-name {
            margin: 0;
            font-size: 1rem;
            color: #6c757d;
          }
          .election-title {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 500;
            color: #495057;
            background-color: #f8f9fa;
            padding: 8px 12px;
            border-radius: 8px;
            display: inline-block;
          }
          .voter-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          .voter-table th, .voter-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          .voter-table th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          .voter-table tr:nth-child(even) { 
            background-color: #f9f9f9; 
          }
          .status-voted { 
            background-color: #d4edda; 
            color: #155724; 
            padding: 2px 6px; 
            border-radius: 3px;
          }
          .status-uncast { 
            background-color: #d1ecf1; 
            color: #0c5460; 
            padding: 2px 6px; 
            border-radius: 3px;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #666; 
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <header class="election-header">
          <div class="branding">
            <img src="../wup-logo.png" alt="Wesleyan University Philippines Logo" class="logo" onerror="this.onerror=null;this.src='https://via.placeholder.com/60x60/cccccc/000000?text=WUP';" />
            <div class="university-info">
              <h1 class="university-name">Wesleyan University-Philippines</h1>
              <p class="system-name">Enhanced Voting System</p>
            </div>
          </div>
          <h2 class="election-title">${title}</h2>
          <p><strong>Total Voters:</strong> ${voters.length}</p>
        </header>
        <table class="voter-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Year</th>
              <th>Department</th>
              <th>Status</th>
              <th>Election</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${voters
              .map((voter) => {
                const fullName =
                  `${voter.firstName} ${voter.middleName ? voter.middleName + " " : ""}${voter.lastName}`.trim();
                const yearName = voter.year?.name || "Unknown";
                const departmentName =
                  voter.year?.departmentName ||
                  voter.year?.department?.name ||
                  "Not assigned";

                return `
                  <tr>
                    <td>${voter.id}</td>
                    <td>${fullName}</td>
                    <td>${voter.email}</td>
                    <td>${yearName}</td>
                    <td>${departmentName}</td>
                    <td>
                      <span class="${voter.status === "CAST" ? "status-voted" : "status-uncast"}">
                        ${voter.status.toLowerCase()}
                      </span>
                    </td>
                    <td>${voter.election?.name || "Not assigned"}</td>
                    <td>${new Date(voter.createdAt).toLocaleDateString()}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>This report contains ${voters.length} voters.</p>
          <p>Generated by: Wesleyan University Philippines - Enhanced Voting System</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();

  // Use a promise to handle print events
  return new Promise((resolve) => {
    let printed = false;

    // Set a flag when print is initiated
    printWindow.addEventListener("beforeprint", () => {
      printed = true;
    });

    // Handle after print or close
    const cleanup = () => {
      // If print was never initiated, it means user cancelled
      if (!printed) {
        resolve({ success: false, cancelled: true });
      } else {
        resolve({ success: true });
      }
    };

    // Listen for print events
    printWindow.addEventListener("afterprint", cleanup);

    // Also handle window close (in case user closes without printing)
    const checkClosed = setInterval(() => {
      if (printWindow.closed) {
        clearInterval(checkClosed);
        cleanup();
      }
    }, 1000);

    // Try to print
    try {
      printWindow.print();
    } catch (error) {
      clearInterval(checkClosed);
      resolve({ success: false, error: "Failed to open print dialog." });
    }
  });
}

import { formatDateTime, calculatePercentage } from "./print-templates";
import type { ElectionDetails, Position } from "@/types/election-results";

interface ExportOptions {
  electionDetails: ElectionDetails;
  positions: Position[];
}

/**
 * Export election results to Excel format
 * @param options Export configuration options
 * @returns Promise that resolves when export is complete
 */
export async function exportElectionResults(
  options: ExportOptions
): Promise<void> {
  const { electionDetails, positions } = options;

  try {
    // Dynamic import to avoid SSR issues
    const [XLSX, { default: saveAs }] = await Promise.all([
      import("xlsx"),
      import("file-saver"),
    ]);

    const startDateTime = formatDateTime(electionDetails.startDate);
    const endDateTime = formatDateTime(electionDetails.endDate);

    // Generate workbook data
    const summaryData = generateSummaryData(
      electionDetails,
      startDateTime,
      endDateTime
    );
    const resultsData = generateResultsData(positions);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create summary worksheet
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    configureSummaryWorksheet(summaryWorksheet);

    // Create results worksheet
    const resultsWorksheet = XLSX.utils.aoa_to_sheet(resultsData);
    configureResultsWorksheet(resultsWorksheet);

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(
      workbook,
      summaryWorksheet,
      "Election Summary"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      resultsWorksheet,
      "Detailed Results"
    );

    // Generate and save file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = generateExportFilename(electionDetails.name);
    saveAs(blob, fileName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Export failed: ${errorMessage}`);
  }
}

/**
 * Generate summary data for Excel export
 */
function generateSummaryData(
  electionDetails: ElectionDetails,
  startDateTime: { date: string; time: string },
  endDateTime: { date: string; time: string }
): (string | number)[][] {
  const turnoutPercentage = Math.round(
    (electionDetails.castedVotes / electionDetails.voters) * 100
  );

  return [
    ["Election Results Summary"],
    [""],
    ["Election Name", electionDetails.name],
    ["Election Start", `${startDateTime.date} ${startDateTime.time}`],
    ["Election End", `${endDateTime.date} ${endDateTime.time}`],
    ["Status", electionDetails.status],
    ["Total Positions", electionDetails.positions],
    ["Total Candidates", electionDetails.candidates],
    ["Total Voters", electionDetails.voters],
    ["Casted Votes", electionDetails.castedVotes],
    ["Uncasted Votes", electionDetails.uncastedVotes],
    ["Voter Turnout", `${turnoutPercentage}%`],
    [""],
    ["Generated On", new Date().toLocaleString()],
    [""],
    [""],
  ];
}

/**
 * Generate detailed results data for Excel export
 */
function generateResultsData(positions: Position[]): (string | number)[][] {
  const resultsData: (string | number)[][] = [
    [
      "Position",
      "Candidate Name",
      "Party/Affiliation",
      "Votes",
      "Percentage",
      "Rank",
      "Winner",
    ],
  ];

  positions.forEach((position) => {
    if (position.candidates.length === 0) {
      resultsData.push([position.name, "No candidates", "", "", "", "", ""]);
    } else {
      position.candidates.forEach((candidate, index) => {
        const percentage = calculatePercentage(
          candidate.votes,
          position.totalVotes
        );
        const isWinner = index === 0 && candidate.votes > 0;

        resultsData.push([
          position.name,
          candidate.name,
          candidate.partylist,
          candidate.votes,
          `${percentage}%`,
          index + 1,
          isWinner ? "YES" : "NO",
        ]);
      });
    }

    // Add empty row between positions
    resultsData.push(["", "", "", "", "", "", ""]);
  });

  return resultsData;
}

/**
 * Configure summary worksheet formatting
 */
function configureSummaryWorksheet(worksheet: any): void {
  worksheet["!cols"] = [
    { wch: 20 }, // Label column
    { wch: 30 }, // Value column
  ];
}

/**
 * Configure results worksheet formatting
 */
function configureResultsWorksheet(worksheet: any): void {
  worksheet["!cols"] = [
    { wch: 25 }, // Position
    { wch: 30 }, // Candidate Name
    { wch: 25 }, // Party
    { wch: 10 }, // Votes
    { wch: 12 }, // Percentage
    { wch: 8 }, // Rank
    { wch: 10 }, // Winner
  ];
}

/**
 * Generate export filename
 */
function generateExportFilename(electionName: string): string {
  const sanitizedName = electionName.replace(/[^a-z0-9]/gi, "_");
  const dateString = new Date().toISOString().split("T")[0];
  return `${sanitizedName}_Results_${dateString}.xlsx`;
}

/**
 * Validate export data before attempting to export
 */
export function validateExportData(options: ExportOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.electionDetails) {
    errors.push("Election details are required");
  }

  if (!options.positions || options.positions.length === 0) {
    errors.push("At least one position is required");
  }

  if (options.electionDetails?.name?.trim() === "") {
    errors.push("Election name cannot be empty");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if export functionality is supported
 */
export function isExportSupported(): boolean {
  return typeof window !== "undefined";
}
