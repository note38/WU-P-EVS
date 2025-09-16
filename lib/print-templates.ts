import type {
  ElectionDetails,
  Position,
  Candidate,
} from "../types/election-results";

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
        margin-top: 30px;
        border-bottom: 1px solid #333;
        width: 300px;
        height: 40px;
        position: relative;
      }
      .signature-info {
        margin-top: 10px;
        font-size: 14px;
        color: #666;
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
export function generateHeaderSection(electionName: string): string {
  return `
    <div class="header">
      <h1>Wesleyan University-Philippines</h1>
      <h2>${electionName}</h2>
    </div>
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
  return `
    <div class="proofread-section">
      <div class="proofread-title">PROOFREAD BY:</div>
      <div class="signature-line"></div>
      <div class="signature-info">
        <strong>${currentUser?.fullName || "Administrator"}</strong><br>
        ${userPosition || "Administrator"}<br>
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
      <p>Generated on ${new Date().toLocaleString()}</p>
      <p>Wesleyan University Philippines - Enhanced Voting System</p>
    </div>
  `;
}

/**
 * Generate complete print template HTML
 */
export function generatePrintTemplate(data: PrintTemplateData): string {
  const { electionDetails, positions, currentUser, userPosition } = data;

  const startDateTime = formatDateTime(electionDetails.startDate);
  const endDateTime = formatDateTime(electionDetails.endDate);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Election Results - ${electionDetails.name}</title>
      ${getPrintStyles()}
    </head>
    <body>
      ${generateHeaderSection(electionDetails.name)}
      ${generateElectionDetailsSection(electionDetails, startDateTime, endDateTime)}
      ${generatePositionsSection(positions)}
      ${generateProofreadSection(currentUser, userPosition)}
      ${generateFooterSection()}
    </body>
    </html>
  `;
}
