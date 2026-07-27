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

    // Prepare data for Excel (exporting only First Name, Middle Name, Last Name, and Email)
    const excelData = voters.map((voter) => ({
      "First Name": voter.firstName,
      "Middle Name": voter.middleName || "",
      "Last Name": voter.lastName,
      Email: voter.email,
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // First Name
      { wch: 20 }, // Middle Name
      { wch: 20 }, // Last Name
      { wch: 35 }, // Email
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

  // Get the base URL for absolute paths
  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "http://localhost:3000";

  // Try to get the logo as a data URL, fallback to URL if it fails
  let logoSrc = `${baseUrl}/wup-logo.png`;
  try {
    logoSrc = await getImageAsDataUrl(`${baseUrl}/wup-logo.png`);
  } catch (error) {
    console.warn(
      "Could not convert logo to data URL, using URL instead:",
      error
    );
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
            line-height: 1.6;
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
            font-size: 1.2rem;
            font-weight: 600;
            color: #212529;
          }
          .system-name {
            margin: 0;
            font-size: 0.9rem;
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
            font-size: 0.9rem;
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
            .voter-table { font-size: 0.8rem; }
            .voter-table th, .voter-table td { padding: 4px; }
          }
          @media (max-width: 768px) {
            body { margin: 10px; }
            .branding { flex-direction: column; text-align: center; }
            .university-info { text-align: center; }
            .election-title { font-size: 1rem; padding: 6px 10px; }
            .voter-table { font-size: 0.8rem; }
            .voter-table th, .voter-table td { padding: 6px; }
          }
          @media (max-width: 480px) {
            .election-header { padding: 15px; }
            .logo { width: 40px; height: 40px; }
            .university-name { font-size: 1.2rem; }
            .system-name { font-size: 0.9rem; }
            .election-title { font-size: 0.9rem; padding: 4px 8px; }
            .voter-table { font-size: 0.7rem; }
            .voter-table th, .voter-table td { padding: 4px; }
            .status-voted, .status-uncast { padding: 1px 3px; font-size: 0.6rem; }
          }
        </style>
      </head>
      <body>
        <header class="election-header">
          <div class="branding">
            <img src="${logoSrc}" alt="WU-P Aurora Enhanced Voting System Logo" class="logo" onerror="this.onerror=null;this.src='https://via.placeholder.com/60x60/cccccc/000000?text=WUP';" />
            <div class="university-info">
              <h1 class="university-name">Development of WU-P Aurora Enhanced Voting System</h1>
              <p class="system-name">DWU-P-AEVS</p>
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
          <p>Generated by: Development of WU-P Aurora Enhanced Voting System (DWU-P-AEVS)</p>
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
    const beforePrintHandler = () => {
      printed = true;
    };

    // Handle after print or close
    const afterPrintHandler = () => {
      printWindow.removeEventListener("beforeprint", beforePrintHandler);
      printWindow.removeEventListener("afterprint", afterPrintHandler);
      // Close window after printing
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 1000);

      resolve({ success: true });
    };

    // Listen for print events
    printWindow.addEventListener("beforeprint", beforePrintHandler);
    printWindow.addEventListener("afterprint", afterPrintHandler);

    // Also handle window close (in case user closes without printing)
    const checkClosed = setInterval(() => {
      if (printWindow.closed) {
        clearInterval(checkClosed);
        // If print was never initiated, it means user cancelled
        if (!printed) {
          resolve({ success: false, cancelled: true });
        } else {
          resolve({ success: true });
        }
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

// Utility function to convert image to data URL
async function getImageAsDataUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Could not get canvas context"));
      }
    };
    img.onerror = () => {
      reject(new Error("Could not load image"));
    };
    img.src = imageUrl;
  });
}

import { formatDateTime, calculatePercentage } from "./print-templates";
import type { ElectionDetails, Position } from "@/types/election-results";

export interface ExportOptions {
  electionDetails: ElectionDetails;
  positions: Position[];
  currentUser?: { fullName?: string | null } | null;
  userPosition?: string;
  winnersOnly?: boolean;
}

// Helper: load image URL as base64 data URL (same as print-templates)
async function getLogoDataUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve(url); // fallback to URL
      }
    };
    img.onerror = () => resolve(url); // fallback to URL
    img.src = url;
  });
}

/**
 * Helper to filter positions so candidates list only contains winners
 */
export function filterPositionsToWinnersOnly(positions: Position[]): Position[] {
  return positions.map((position) => {
    if (!position.candidates || position.candidates.length === 0) {
      return position;
    }
    const maxCand = position.maxCandidates || 1;
    const thresholdIndex = Math.min(
      maxCand - 1,
      position.candidates.length - 1
    );
    const winningThreshold = position.candidates[thresholdIndex].votes;

    const winningCandidates = position.candidates.filter(
      (c) => c.votes > 0 && c.votes >= winningThreshold
    );

    return {
      ...position,
      candidates: winningCandidates,
    };
  });
}

/**
 * Export election results to PDF format (matches print layout)
 * @param options Export configuration options
 * @returns Promise that resolves when export is complete
 */
export async function exportElectionResults(
  options: ExportOptions
): Promise<void> {
  const { electionDetails, currentUser, userPosition, winnersOnly } = options;
  const positions = winnersOnly
    ? filterPositionsToWinnersOnly(options.positions)
    : options.positions;

  try {
    const { default: jsPDF } = await import("jspdf");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 14;
    const contentW = pageW - margin * 2;

    const startDateTime = formatDateTime(electionDetails.startDate);
    const endDateTime = formatDateTime(electionDetails.endDate);
    const turnoutPercentage =
      electionDetails.voters > 0
        ? Math.round((electionDetails.castedVotes / electionDetails.voters) * 100)
        : 0;

    // ── Load logo ────────────────────────────────────────────────────────────
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "";
    let logoDataUrl: string | null = null;
    if (baseUrl) {
      try {
        logoDataUrl = await getLogoDataUrl(`${baseUrl}/wup-logo.png`);
      } catch {
        logoDataUrl = null;
      }
    }

    // ── HEADER (white bg, bottom border — same as print) ─────────────────────
    const headerH = 40;
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, headerH, "F");
    doc.setDrawColor(222, 226, 230);
    doc.setLineWidth(0.5);
    doc.line(margin, headerH, pageW - margin, headerH);

    const logoSize = 16; // mm
    const logoY = 6;
    const logoW = logoDataUrl ? logoSize : 0;
    const gap = logoDataUrl ? 5 : 0;

    // Measure text to center the block
    const mainTitle = "Development of WU-P Aurora Enhanced Voting System";
    const subTitle = "DWU-P-AEVS";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const mainTitleW = doc.getTextWidth(mainTitle);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const subTitleW = doc.getTextWidth(subTitle);

    const textW = Math.max(mainTitleW, subTitleW);
    const totalBlockW = logoW + gap + textW;
    
    // Calculate starting X to perfectly center the entire block
    const blockStartX = (pageW - totalBlockW) / 2;
    const textStartX = blockStartX + logoW + gap;

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", blockStartX, logoY, logoSize, logoSize);
    }

    // University name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    doc.text(mainTitle, textStartX, logoY + 5);

    // System abbreviation
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(108, 117, 125);
    doc.text(subTitle, textStartX, logoY + 11);

    // Election title pill
    const titleText = winnersOnly
      ? `${electionDetails.name} (Official Winners)`
      : electionDetails.name;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(73, 80, 87);
    const titleW = Math.min(doc.getTextWidth(titleText) + 10, contentW);
    const titleX = (pageW - titleW) / 2;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(titleX, logoY + 14, titleW, 8, 2, 2, "F");
    doc.text(titleText, 105, logoY + 20, { align: "center", maxWidth: contentW - 8 });

    let currentY = headerH + 6;

    // ── ELECTION DETAILS BOX ─────────────────────────────────────────────────
    const detailBoxH = 44;
    doc.setFillColor(249, 249, 249);
    doc.rect(margin, currentY, contentW, detailBoxH, "F");
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, contentW, detailBoxH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text("Election Details", margin + 4, currentY + 7);

    const col = contentW / 3;
    const detailItems = [
      ["Election Start:", `${startDateTime.date} ${startDateTime.time}`],
      ["Election End:", `${endDateTime.date} ${endDateTime.time}`],
      ["Status:", electionDetails.status],
      ["Positions:", String(electionDetails.positions)],
      ["Candidates:", String(electionDetails.candidates)],
      ["Total Voters:", String(electionDetails.voters)],
      ["Casted Votes:", String(electionDetails.castedVotes)],
      ["Uncasted Votes:", String(electionDetails.uncastedVotes)],
      ["Turnout:", `${turnoutPercentage}%`],
    ];

    const colOffsets = [margin + 4, margin + 4 + col, margin + 4 + col * 2];
    doc.setFontSize(8.5);
    for (let row = 0; row < 3; row++) {
      for (let colIdx = 0; colIdx < 3; colIdx++) {
        const item = detailItems[colIdx * 3 + row];
        const x = colOffsets[colIdx];
        const y = currentY + 15 + row * 9;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text(item[0], x, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(item[1], x + doc.getTextWidth(item[0]) + 2, y);
      }
    }

    currentY += detailBoxH + 6;

    // ── POSITION CARDS ───────────────────────────────────────────────────────
    for (const position of positions) {
      if (currentY > 245) {
        doc.addPage();
        currentY = 14;
      }

      // Position header bar
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, currentY, contentW, 9, "F");
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.3);
      doc.rect(margin, currentY, contentW, 9);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(33, 37, 41);
      doc.text(
        `${position.name}  (${position.totalVotes} total votes)`,
        margin + 4,
        currentY + 6
      );
      currentY += 9;

      if (position.candidates.length === 0) {
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, currentY, contentW, 10, "F");
        doc.setDrawColor(238, 238, 238);
        doc.rect(margin, currentY, contentW, 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text("No candidates for this position", margin + 4, currentY + 6.5);
        currentY += 10;
      } else {
        const thresholdIndex = Math.min(
          position.maxCandidates - 1,
          position.candidates.length - 1
        );
        const winningThreshold =
          position.candidates.length > 0
            ? position.candidates[thresholdIndex].votes
            : 0;

        // Column layout: [left info zone] [right: votes + % + badge]
        const rightZoneW = 42; // mm for votes/percent/badge on the right
        const leftZoneW = contentW - rightZoneW;

        for (let ci = 0; ci < position.candidates.length; ci++) {
          const candidate = position.candidates[ci];
          const isWinner =
            candidate.votes > 0 && candidate.votes >= winningThreshold;
          const percentage = calculatePercentage(
            candidate.votes,
            position.totalVotes
          );
          const rowH = 15;

          if (currentY + rowH > 278) {
            doc.addPage();
            currentY = 14;
          }

          // Row background
          if (isWinner) {
            doc.setFillColor(240, 249, 255); // light blue for winner
          } else {
            const shade = ci % 2 === 0 ? 255 : 252;
            doc.setFillColor(shade, shade, shade);
          }
          doc.rect(margin, currentY, contentW, rowH, "F");
          doc.setDrawColor(238, 238, 238);
          doc.setLineWidth(0.2);
          doc.line(margin, currentY + rowH, margin + contentW, currentY + rowH);

          // ── Left zone: name + party ──────────────────────────────────────
          doc.setFont("helvetica", isWinner ? "bold" : "normal");
          doc.setFontSize(9);
          doc.setTextColor(33, 37, 41);
          doc.text(candidate.name, margin + 4, currentY + 5.5, {
            maxWidth: leftZoneW - 8,
          });

          // Party
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(102, 102, 102);
          doc.text(candidate.partylist, margin + 4, currentY + 11.5, {
            maxWidth: leftZoneW - 8,
          });

          // ── Right zone: votes on top, percentage below, WINNER badge ────
          const rightX = margin + leftZoneW;

          // Votes
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(33, 37, 41);
          doc.text(String(candidate.votes), rightX + rightZoneW / 2, currentY + 6, {
            align: "center",
          });

          // Percentage
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(102, 102, 102);
          doc.text(`${percentage}%`, rightX + rightZoneW / 2, currentY + 11, {
            align: "center",
          });

          // WINNER badge — placed on far right of row, vertically centred
          if (isWinner) {
            const badgeLabel = "WINNER";
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.5);
            const bw = doc.getTextWidth(badgeLabel) + 5;
            const bx = margin + contentW - bw - 2;
            const by = currentY + (rowH - 5) / 2;
            doc.setFillColor(16, 185, 129);
            doc.roundedRect(bx, by, bw, 5, 1.5, 1.5, "F");
            doc.setTextColor(255, 255, 255);
            doc.text(badgeLabel, bx + bw / 2, by + 3.6, { align: "center" });
          }

          currentY += rowH;
        }
      }

      // Bottom border of card
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, margin + contentW, currentY);
      currentY += 8;
    }

    // ── PROOFREAD BY ─────────────────────────────────────────────────────────
    if (currentY > 240) {
      doc.addPage();
      currentY = 14;
    }
    currentY += 4;

    const proofH = 42;
    doc.setFillColor(249, 249, 249);
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, contentW, proofH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text("PROOFREAD BY:", margin + 4, currentY + 8);

    // Signature line
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(0.5);
    doc.line(margin + 4, currentY + 28, margin + 4 + 80, currentY + 28);

    // Name below line
    const adminName = currentUser?.fullName || "Administrator";
    const adminPosition = userPosition?.trim() || "Administrator";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(33, 37, 41);
    doc.text(adminName, margin + 4, currentY + 33);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(adminPosition, margin + 4, currentY + 38);

    // Date on right
    doc.text(
      `Date: ${new Date().toLocaleDateString()}`,
      margin + contentW - 4,
      currentY + 33,
      { align: "right" }
    );

    currentY += proofH + 6;

    // ── FOOTER on every page ─────────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.3);
      doc.line(margin, 289, pageW - margin, 289);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(102, 102, 102);
      doc.text(
        "Generated by: Development of WU-P Aurora Enhanced Voting System (DWU-P-AEVS)",
        105,
        294,
        { align: "center" }
      );
      doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 294, {
        align: "right",
      });
    }

    const suffix = winnersOnly ? "Winners" : "Results";
    const fileName = `${electionDetails.name.replace(/[^a-z0-9]/gi, "_")}_${suffix}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
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
        const isWinner = index < position.maxCandidates && candidate.votes > 0;

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
