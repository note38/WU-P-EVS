// Types for election results functionality

export interface ElectionDetails {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  positions: number;
  candidates: number;
  voters: number;
  castedVotes: number;
  uncastedVotes: number;
}

export interface Candidate {
  id: number;
  name: string;
  avatar: string | null;
  partylist: string;
  votes: number;
}

export interface Position {
  id: number;
  name: string;
  maxCandidates: number;
  candidates: Candidate[];
  totalVotes: number;
}

export interface ResultsTabProps {
  electionId: number;
}

export interface PrintTemplateData {
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

export interface DateTimeFormatted {
  date: string;
  time: string;
}
