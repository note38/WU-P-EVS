# Export Functionality Setup

This document explains how to set up the PDF and Excel export functionality for the voting system.

## Required Dependencies

To enable PDF and Excel export features, you need to install the following packages:

```bash
npm install jspdf jspdf-autotable xlsx file-saver
```

### For TypeScript support (optional but recommended):

```bash
npm install --save-dev @types/file-saver
```

## Package Details

- **jspdf**: Library for generating PDF documents
- **jspdf-autotable**: Plugin for jsPDF to create tables
- **xlsx**: Library for reading and writing Excel files
- **file-saver**: Library for saving files on the client-side

## Features Available

### Print Functionality

- ✅ **Already Working** - No additional dependencies required
- Prints voter data in a formatted table
- Includes report metadata and styling

### PDF Export

- 📦 **Requires**: `jspdf` and `jspdf-autotable`
- Generates professional PDF reports
- Includes table formatting and metadata
- Landscape orientation for better table display

### Excel Export

- 📦 **Requires**: `xlsx` and `file-saver`
- Creates Excel files with multiple sheets
- Includes voter data and report metadata
- Proper column formatting and widths

## Usage

Once the dependencies are installed, the export buttons will be fully functional:

1. **Print Button**: Opens browser print dialog
2. **Export Dropdown**:
   - Export as PDF
   - Export as Excel

## Error Handling

If the required dependencies are not installed, the system will:

- Show helpful error messages
- Guide users to install the required packages
- Allow print functionality to work regardless

## File Naming Convention

Exported files follow this naming pattern:

- PDF: `all_voters_report_YYYY-MM-DD.pdf`
- Excel: `all_voters_report_YYYY-MM-DD.xlsx`

## Installation Command

Run this command in your project root to install all required dependencies:

```bash
npm install jspdf jspdf-autotable xlsx file-saver @types/file-saver
```

After installation, restart your development server:

```bash
npm run dev
```
