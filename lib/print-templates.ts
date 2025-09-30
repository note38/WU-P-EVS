import type {
  ElectionDetails,
  Position,
  Candidate,
} from "../types/election-results";

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

interface PrintTemplateData {
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

interface DateTimeFormatted {
  date: string;
  time: string;
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string): DateTimeFormatted {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString("en-GB"),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

/**
 * Calculate vote percentage
 */
export function calculatePercentage(votes: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((votes / total) * 100);
}

/**
 * Generate print styles CSS
 */
export function getPrintStyles(): string {
  return `
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
      .election-header {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #dee2e6; /* Adds a subtle separator line */
  text-align: center;
}

/* Container for the logo and university name */
.branding {
  display: flex;
  align-items: center;
  justify-content: center; /* Centers the branding section */
  gap: 16px; /* Creates space between the logo and the text */
  margin-bottom: 16px;
}

/* Styles for the university logo */
.logo {
  width: 60px;  /* Adjust size as needed */
  height: 60px;
}

/* Aligns the university name and system name vertically */
.university-info {
  text-align: left;
}

/* University Name (H1) */
.university-name {
  margin: 0;
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  color: #212529; /* Darker text for better contrast */
}

/* "Enhanced Voting System" text (P) */
.system-name {
  margin: 0;
  font-size: 1rem; /* 16px */
  color: #6c757d; /* Softer color for the subtitle */
}

/* Title of the specific election (H2) */
.election-title {
  margin: 0;
  font-size: 1.25rem; /* 20px */
  font-weight: 500;
  color: #495057;
  background-color: #f8f9fa; /* A very light grey to make it stand out */
  padding: 8px 12px;
  border-radius: 8px; /* Rounded corners */
  display: inline-block; /* Ensures background only covers the text */
}
      .election-details { 
        margin-bottom: 30px; 
        background: #f9f9f9; 
        padding: 15px; 
        border-radius: 5px;
      }

      .election-details h3 { 
        margin-top: 0; 
        color: #1f2937;
      }
      .details-grid { 
        display: grid; 
        grid-template-columns: repeat(3, 1fr); 
        gap: 15px; 
      }
      .detail-item { 
        display: flex; 
        justify-content: space-between; 
        padding: 5px 0;
        border-bottom: 1px solid #e0e0e0;
      }
      .position-card { 
        margin-bottom: 25px; 
        border: 1px solid #ddd; 
        border-radius: 5px;
        page-break-inside: avoid;
      }
      .position-header { 
        background: #f0f0f0; 
        padding: 15px; 
        font-weight: bold; 
        font-size: 18px;
        border-bottom: 1px solid #ddd;
      }
      .candidate { 
        padding: 10px 15px; 
        border-bottom: 1px solid #eee; 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
      }
      .candidate:last-child { 
        border-bottom: none; 
      }
      .winner { 
        background: #f0f9ff; 
        font-weight: bold;
      }
      .candidate-info { 
        flex: 1; 
      }
      .candidate-name { 
        font-weight: bold; 
        margin-bottom: 3px;
      }
      .candidate-party { 
        color: #666; 
        font-size: 14px;
      }
      .vote-info { 
        text-align: right; 
      }
      .votes { 
        font-size: 18px; 
        font-weight: bold;
      }
      .percentage { 
        color: #666; 
        font-size: 14px;
      }
      .winner-badge { 
        background: #10b981; 
        color: white; 
        padding: 2px 8px; 
        border-radius: 12px; 
        font-size: 12px;
        margin-left: 10px;
      }
      .proofread-section {
        margin-top: 40px;
        padding: 20px;
        
        border: 1px solid #ddd;
        border-radius: 5px;
        background: #f9f9f9;
        page-break-inside: avoid;
      }
      .proofread-title {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 15px;
        color: #1f2937;
      }
      .signature-line {
        margin-top: 20px;
        border-bottom: 1px solid #333;
        width: 300px;
        height: 40px;
        position: relative;
      }
      .signature-info {
        margin-top: 10px;
        font-size: 14px;
        color: #666;\
        
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
        .position-card { page-break-inside: avoid; }
        .proofread-section { page-break-inside: avoid; }
      }
        
    </style>
  `;
}

/**
 * Generate header section HTML
 */
export async function generateHeaderSection(
  electionName: string
): Promise<string> {
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

  return `
    <header class="election-header">
      <div class="branding">
        <img src="${logoSrc}" alt="Wesleyan University Philippines Logo" class="logo" onerror="this.onerror=null;this.src='https://via.placeholder.com/60x60/cccccc/000000?text=WUP';" />
        <div class="university-info">
          <h1 class="university-name">Wesleyan University-Philippines</h1>
          <p class="system-name">Enhanced Voting System</p>
        </div>
      </div>
      <h2 class="election-title">${electionName}</h2>
    </header>
  `;
}

/**
 * Generate election details section HTML
 */
export function generateElectionDetailsSection(
  electionDetails: ElectionDetails,
  startDateTime: DateTimeFormatted,
  endDateTime: DateTimeFormatted
): string {
  const turnoutPercentage = Math.round(
    (electionDetails.castedVotes / electionDetails.voters) * 100
  );

  return `
    <div class="election-details">
      <h3>Election Details</h3>
      <div class="details-grid">
        <div>
          <div class="detail-item">
            <span><strong>Election Start:</strong></span>
            <span>${startDateTime.date} ${startDateTime.time}</span>
          </div>
          <div class="detail-item">
            <span><strong>Election End:</strong></span>
            <span>${endDateTime.date} ${endDateTime.time}</span>
          </div>
          <div class="detail-item">
            <span><strong>Status:</strong></span>
            <span>${electionDetails.status}</span>
          </div>
        </div>
        <div>
          <div class="detail-item">
            <span><strong>Positions:</strong></span>
            <span>${electionDetails.positions}</span>
          </div>
          <div class="detail-item">
            <span><strong>Candidates:</strong></span>
            <span>${electionDetails.candidates}</span>
          </div>
          <div class="detail-item">
            <span><strong>Total Voters:</strong></span>
            <span>${electionDetails.voters}</span>
          </div>
        </div>
        <div>
          <div class="detail-item">
            <span><strong>Casted Votes:</strong></span>
            <span style="color: #10b981; font-weight: bold;">${electionDetails.castedVotes}</span>
          </div>
          <div class="detail-item">
            <span><strong>Uncasted Votes:</strong></span>
            <span style="color: #f59e0b; font-weight: bold;">${electionDetails.uncastedVotes}</span>
          </div>
          <div class="detail-item">
            <span><strong>Turnout:</strong></span>
            <span>${turnoutPercentage}%</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate candidate HTML for a position
 */
export function generateCandidateHTML(
  candidate: Candidate,
  index: number,
  totalVotes: number
): string {
  const percentage = calculatePercentage(candidate.votes, totalVotes);
  const isWinner = index === 0 && candidate.votes > 0;

  return `
    <div class="candidate ${isWinner ? "winner" : ""}">
      <div class="candidate-info">
        <div class="candidate-name">
          ${candidate.name}
          ${isWinner ? '<span class="winner-badge">WINNER</span>' : ""}
        </div>
        <div class="candidate-party">${candidate.partylist}</div>
      </div>
      <div class="vote-info">
        <div class="votes">${candidate.votes}</div>
        <div class="percentage">${percentage}%</div>
      </div>
    </div>
  `;
}

/**
 * Generate position card HTML
 */
export function generatePositionCard(position: Position): string {
  const candidatesHTML =
    position.candidates.length === 0
      ? '<div class="candidate">No candidates for this position</div>'
      : position.candidates
          .map((candidate: Candidate, index: number) =>
            generateCandidateHTML(candidate, index, position.totalVotes)
          )
          .join("");

  return `
    <div class="position-card">
      <div class="position-header">
        ${position.name} (${position.totalVotes} total votes)
      </div>
      ${candidatesHTML}
    </div>
  `;
}

/**
 * Generate all positions section HTML
 */
export function generatePositionsSection(positions: Position[]): string {
  return positions.map((position) => generatePositionCard(position)).join("");
}

/**
 * Generate proofread section HTML
 */
export function generateProofreadSection(
  currentUser: { fullName?: string | null } | null | undefined,
  userPosition: string
): string {
  // Use a default value if userPosition is empty or just whitespace
  const displayPosition = userPosition?.trim() || "Administrator";

  return `
    <div class="proofread-section">
      <div class="proofread-title">PROOFREAD BY:</div>
      <div class="signature-line"></div>
      <div class="signature-info">
        <strong>${currentUser?.fullName || "Administrator"}</strong><br>
        ${displayPosition}<br>
        Date: ${new Date().toLocaleDateString()}
      </div>
    </div>
  `;
}

/**
 * Generate footer section HTML
 */
export function generateFooterSection(): string {
  return `
    <div class="footer">
      <p>Generated by: Wesleyan University Philippines - Enhanced Voting System</p>
    </div>
  `;
}

/**
 * Generate complete print template HTML
 */
export async function generatePrintTemplate(
  data: PrintTemplateData
): Promise<string> {
  const { electionDetails, positions, currentUser, userPosition } = data;

  const startDateTime = formatDateTime(electionDetails.startDate);
  const endDateTime = formatDateTime(electionDetails.endDate);

  const headerSection = await generateHeaderSection(electionDetails.name);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Election Results - ${electionDetails.name}</title>
      ${getPrintStyles()}
    </head>
    <body>
      ${headerSection}
      ${generateElectionDetailsSection(electionDetails, startDateTime, endDateTime)}
      ${generatePositionsSection(positions)}
      ${generateProofreadSection(currentUser, userPosition)}
      ${generateFooterSection()}
    </body>
    </html>
  `;
}
