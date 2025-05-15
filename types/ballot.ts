export interface Candidate {
  id: string;
  name: string;
  party: string;
  avatar?: string;
}

export interface Position {
  id: string;
  title: string;
  candidates: Candidate[];
}

export interface Election {
  id: string;
  name: string;
  description?: string;
  status: "INACTIVE" | "ACTIVE" | "COMPLETED";
  startDate: Date;
  endDate: Date;
  positions: Position[];
}

export interface Ballot {
  election: Election;
  positions: Position[];
  selections: Record<string, string>;
}

export interface BallotSelection {
  positionId: string;
  candidateId: string;
}

export interface BallotSubmission {
  selections: Record<string, string>;
  voterId: string;
  submittedAt: Date;
}
