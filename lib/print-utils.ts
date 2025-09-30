import { generatePrintTemplate } from "./print-templates";
import type { ElectionDetails, Position } from "@/types/election-results";

interface PrintOptions {
  electionDetails: ElectionDetails;
  positions: Position[];
  currentUser:
    | {
        fullName?: string | null;
      }
    | null
    | undefined;
  userPosition: string;
}

/**
 * Handle printing election results
 * @param options Print configuration options
 * @returns Promise that resolves when print is initiated
 */
export async function printElectionResults(
  options: PrintOptions
): Promise<void> {
  const { electionDetails, positions, currentUser, userPosition } = options;

  try {
    // Generate the complete HTML content using the template
    const printContent = await generatePrintTemplate({
      electionDetails,
      positions,
      currentUser,
      userPosition,
    });

    // Open print window
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error(
        "Unable to open print window. Please check your popup blocker settings."
      );
    }

    // Write content to the print window
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    const printTimeout = setTimeout(() => {
      try {
        printWindow.print();

        // Close the window after a short delay to allow printing dialog to appear
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      } catch (error) {
        console.error("Failed to initiate print:", error);
      }
    }, 500);

    // Handle window close event
    printWindow.addEventListener("beforeunload", () => {
      clearTimeout(printTimeout);
    });
  } catch (error) {
    console.error("Print preparation failed:", error);
    throw new Error(`Print preparation failed: ${error}`);
  }
}

/**
 * Validate print data before attempting to print
 * @param options Print configuration options
 * @returns Validation result with any error messages
 */
export function validatePrintData(options: PrintOptions): {
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
 * Generate print-ready filename for the election results
 * @param electionName The name of the election
 * @param includeDate Whether to include the current date in the filename
 * @returns Sanitized filename string
 */
export function generatePrintFilename(
  electionName: string,
  includeDate = true
): string {
  // Sanitize the election name for use in filename
  const sanitizedName = electionName
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, "_")
    .trim();

  const dateSuffix = includeDate
    ? `_${new Date().toISOString().split("T")[0]}`
    : "";

  return `${sanitizedName}_Results${dateSuffix}`;
}

/**
 * Check if browser supports printing functionality
 * @returns Whether printing is supported
 */
export function isPrintSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.print === "function" &&
    typeof window.open === "function"
  );
}
