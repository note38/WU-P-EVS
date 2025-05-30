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
  credentialsSent: boolean;
  year?: {
    id: number;
    name: string;
    departmentName?: string;
    departmentId?: number;
  };
  election?: {
    id: number;
    name: string;
  };
}

// Enhanced voter type that includes department information
export interface EnhancedVoterData extends VoterData {
  year: {
    id: number;
    name: string;
    departmentName?: string;
    departmentId?: number;
    departmentImage?: string | null;
  };
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
      const yearParts = voter.year.name ? voter.year.name.split(" - ") : [];
      yearName = yearParts[0] || voter.year.name || "Unknown";
    } else {
      // Fallback to parsing from year name
      const yearParts = voter.year?.name ? voter.year.name.split(" - ") : [];
      yearName = yearParts[0] || "Unknown";
      departmentName = yearParts[1] || "General";
    }

    return {
      id: voter.id,
      firstName: voter.firstName,
      middleName: voter.middleName,
      lastName: voter.lastName,
      email: voter.email,
      status: voter.status,
      createdAt: voter.createdAt,
      credentialsSent: voter.credentialsSent,
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
      voter.year?.departmentName || "General",
      voter.status.toLowerCase(),
      voter.election?.name || "Not assigned",
      new Date(voter.createdAt).toLocaleDateString(),
      voter.credentialsSent ? "Sent" : "Pending",
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
          "Credentials",
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
        8: { cellWidth: 20 }, // Credentials
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
    const XLSX = await import("xlsx");
    const { default: saveAs } = await import("file-saver");

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
      Department: voter.year?.departmentName || "General",
      Status: voter.status,
      Election: voter.election?.name || "Not assigned",
      "Created Date": new Date(voter.createdAt).toLocaleDateString(),
      "Created Time": new Date(voter.createdAt).toLocaleTimeString(),
      "Credentials Sent": voter.credentialsSent ? "Yes" : "No",
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
      { wch: 15 }, // Credentials Sent
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
    console.error("Error exporting to Excel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Print function (enhanced version)
export function printVoters(
  voters: ExportVoter[],
  title: string = "Voters Report"
) {
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
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #2563eb;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .voter-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
            font-size: 12px;
          }
          .voter-table th, .voter-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          .voter-table th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
            color: #2563eb;
          }
          .voter-table tr:nth-child(even) { 
            background-color: #f9f9f9; 
          }
          .voter-table tr:hover {
            background-color: #f5f5f5;
          }
          .status-voted { 
            background-color: #d4edda; 
            color: #155724; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-weight: bold;
          }
          .status-registered { 
            background-color: #d1ecf1; 
            color: #0c5460; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-weight: bold;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .voter-table { font-size: 10px; }
            .voter-table th, .voter-table td { padding: 4px; }
          }
          @page {
            margin: 1cm;
            size: A4 landscape;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p><strong>Total Voters:</strong> ${voters.length}</p>
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
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
              <th>Credentials</th>
            </tr>
          </thead>
          <tbody>
            ${voters
              .map((voter) => {
                const fullName =
                  `${voter.firstName} ${voter.middleName ? voter.middleName + " " : ""}${voter.lastName}`.trim();
                const yearName = voter.year?.name || "Unknown";
                const departmentName = voter.year?.departmentName || "General";

                return `
                  <tr>
                    <td>${voter.id}</td>
                    <td>${fullName}</td>
                    <td>${voter.email}</td>
                    <td>${yearName}</td>
                    <td>${departmentName}</td>
                    <td>
                      <span class="${voter.status === "VOTED" ? "status-voted" : "status-registered"}">
                        ${voter.status.toLowerCase()}
                      </span>
                    </td>
                    <td>${voter.election?.name || "Not assigned"}</td>
                    <td>${new Date(voter.createdAt).toLocaleDateString()}</td>
                    <td>${voter.credentialsSent ? "Sent" : "Pending"}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>This report contains ${voters.length} voters.</p>
          <p>Generated by Voting System - Admin Dashboard</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();

  return { success: true };
}
